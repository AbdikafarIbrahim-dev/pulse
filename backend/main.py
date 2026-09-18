from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from database import SessionLocal, engine, Base
import models
import schemas
import auth
import ai_companion

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

PROVIDER_ROLES = ["pharmacy", "lab"]
HOSPITAL_STAFF_ROLES = ["doctor", "pharmacy", "lab", "admin"]

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = auth.decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.get("/")
def read_root():
    return {"message": "Pulse backend is alive"}

@app.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    hashed_pw = auth.hash_password(user.password)
    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_pw,
        role=user.role,
    )
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/me", response_model=schemas.UserResponse)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/records", response_model=schemas.MedicalRecordResponse)
def create_record(
    record: schemas.MedicalRecordCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_record = models.MedicalRecord(
        title=record.title,
        description=record.description,
        patient_id=current_user.id,
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

@app.get("/records", response_model=List[schemas.MedicalRecordResponse])
def get_my_records(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(models.MedicalRecord).filter(
        models.MedicalRecord.patient_id == current_user.id
    ).all()

@app.post("/records/{record_id}/share", response_model=schemas.RecordAccessResponse)
def share_record(
    record_id: int,
    share_request: schemas.ShareRecordRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(models.MedicalRecord).filter(
        models.MedicalRecord.id == record_id,
        models.MedicalRecord.patient_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    doctor = db.query(models.User).filter(
        models.User.email == share_request.doctor_email,
        models.User.role == "doctor",
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    existing = db.query(models.RecordAccess).filter(
        models.RecordAccess.record_id == record_id,
        models.RecordAccess.doctor_id == doctor.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already shared with this doctor")

    access = models.RecordAccess(record_id=record_id, doctor_id=doctor.id)
    db.add(access)
    db.commit()
    db.refresh(access)
    return access

@app.delete("/records/{record_id}/share/{doctor_id}")
def revoke_share(
    record_id: int,
    doctor_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(models.MedicalRecord).filter(
        models.MedicalRecord.id == record_id,
        models.MedicalRecord.patient_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    access = db.query(models.RecordAccess).filter(
        models.RecordAccess.record_id == record_id,
        models.RecordAccess.doctor_id == doctor_id,
    ).first()
    if not access:
        raise HTTPException(status_code=404, detail="Share not found")

    db.delete(access)
    db.commit()
    return {"message": "Access revoked"}

@app.get("/shared-with-me", response_model=List[schemas.SharedRecordResponse])
def get_shared_with_me(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this route")

    accesses = db.query(models.RecordAccess).filter(
        models.RecordAccess.doctor_id == current_user.id
    ).all()

    results = []
    for access in accesses:
        record = access.record
        results.append(schemas.SharedRecordResponse(
            id=record.id,
            title=record.title,
            description=record.description,
            created_at=record.created_at,
            patient_name=record.patient.full_name,
        ))
    return results

@app.post("/appointments", response_model=schemas.AppointmentResponse)
def create_appointment(
    appointment: schemas.AppointmentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can book appointments")

    doctor = db.query(models.User).filter(
        models.User.email == appointment.doctor_email,
        models.User.role == "doctor",
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    conflict = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor.id,
        models.Appointment.scheduled_time == appointment.scheduled_time,
        models.Appointment.status != "cancelled",
    ).first()
    if conflict:
        raise HTTPException(status_code=400, detail="This time slot is already booked")

    new_appointment = models.Appointment(
        patient_id=current_user.id,
        doctor_id=doctor.id,
        scheduled_time=appointment.scheduled_time,
        status="pending",
    )
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    return new_appointment

@app.get("/appointments", response_model=List[schemas.AppointmentResponse])
def get_my_appointments(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "doctor":
        return db.query(models.Appointment).filter(
            models.Appointment.doctor_id == current_user.id
        ).all()
    else:
        return db.query(models.Appointment).filter(
            models.Appointment.patient_id == current_user.id
        ).all()

@app.patch("/appointments/{appointment_id}/status", response_model=schemas.AppointmentResponse)
def update_appointment_status(
    appointment_id: int,
    update: schemas.AppointmentStatusUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update appointment status")

    appointment = db.query(models.Appointment).filter(
        models.Appointment.id == appointment_id,
        models.Appointment.doctor_id == current_user.id,
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if update.status not in ["confirmed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Status must be 'confirmed' or 'cancelled'")

    appointment.status = update.status
    db.commit()
    db.refresh(appointment)
    return appointment

@app.post("/products", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in PROVIDER_ROLES:
        raise HTTPException(status_code=403, detail="Only pharmacies or labs can list products")

    new_product = models.Product(
        pharmacy_id=current_user.id,
        name=product.name,
        description=product.description,
        category=product.category,
        price=product.price,
        stock_quantity=product.stock_quantity,
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.get("/products", response_model=List[schemas.ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).filter(models.Product.stock_quantity > 0).all()

@app.post("/orders", response_model=schemas.OrderResponse)
def create_order(
    order: schemas.OrderCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can place orders")

    product = db.query(models.Product).filter(models.Product.id == order.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.stock_quantity < order.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock available")

    product.stock_quantity -= order.quantity

    new_order = models.Order(
        patient_id=current_user.id,
        product_id=order.product_id,
        quantity=order.quantity,
        status="pending",
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

@app.get("/orders", response_model=List[schemas.OrderResponse])
def get_my_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role in PROVIDER_ROLES:
        return db.query(models.Order).join(models.Product).filter(
            models.Product.pharmacy_id == current_user.id
        ).all()
    else:
        return db.query(models.Order).filter(
            models.Order.patient_id == current_user.id
        ).all()

@app.patch("/orders/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int,
    update: schemas.OrderStatusUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in PROVIDER_ROLES:
        raise HTTPException(status_code=403, detail="Only pharmacies or labs can update order status")

    order = db.query(models.Order).join(models.Product).filter(
        models.Order.id == order_id,
        models.Product.pharmacy_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if update.status not in ["processing", "shipped", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    order.status = update.status
    db.commit()
    db.refresh(order)
    return order

@app.patch("/orders/{order_id}/result", response_model=schemas.OrderResponse)
def attach_order_result(
    order_id: int,
    update: schemas.OrderResultUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "lab":
        raise HTTPException(status_code=403, detail="Only labs can attach results")

    order = db.query(models.Order).join(models.Product).filter(
        models.Order.id == order_id,
        models.Product.pharmacy_id == current_user.id,
        models.Product.category == "lab_test",
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    order.result = update.result
    order.status = "completed"
    db.commit()
    db.refresh(order)
    return order

@app.post("/ai/ask", response_model=schemas.AIResponse)
def ask_ai(
    question: schemas.AIQuestion,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can use the AI companion")

    records = db.query(models.MedicalRecord).filter(
        models.MedicalRecord.patient_id == current_user.id
    ).all()

    answer = ai_companion.ask_ai_about_records(question.question, records)
    return {"answer": answer}

@app.post("/hospitals", response_model=schemas.HospitalResponse)
def create_hospital(
    hospital: schemas.HospitalCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create hospitals")

    new_hospital = models.Hospital(name=hospital.name)
    db.add(new_hospital)
    db.commit()
    db.refresh(new_hospital)

    current_user.hospital_id = new_hospital.id
    db.commit()

    return new_hospital

@app.post("/hospitals/{hospital_id}/join")
def join_hospital(
    hospital_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in HOSPITAL_STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Only staff roles can join a hospital")

    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    current_user.hospital_id = hospital_id
    db.commit()
    return {"message": f"Joined {hospital.name}"}

@app.get("/hospitals/dashboard", response_model=schemas.HospitalDashboard)
def get_hospital_dashboard(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view the hospital dashboard")

    if not current_user.hospital_id:
        raise HTTPException(status_code=400, detail="You are not associated with a hospital")

    hospital = db.query(models.Hospital).filter(models.Hospital.id == current_user.hospital_id).first()

    staff = db.query(models.User).filter(models.User.hospital_id == hospital.id).all()

    staff_doctor_ids = [s.id for s in staff if s.role == "doctor"]
    total_appointments = db.query(models.Appointment).filter(
        models.Appointment.doctor_id.in_(staff_doctor_ids)
    ).count() if staff_doctor_ids else 0

    staff_provider_ids = [s.id for s in staff if s.role in PROVIDER_ROLES]
    total_orders = db.query(models.Order).join(models.Product).filter(
        models.Product.pharmacy_id.in_(staff_provider_ids)
    ).count() if staff_provider_ids else 0

    return schemas.HospitalDashboard(
        hospital=hospital,
        staff=staff,
        total_appointments=total_appointments,
        total_orders=total_orders,
    )