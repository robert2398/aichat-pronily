# Pornily Deployment Guide

## 🚀 Connecting to AWS RDS (PostgreSQL)

Use the following command to connect to the AWS RDS instance:

```bash
psql -h aichat.c7sw0kqsq1e1.eu-north-1.rds.amazonaws.com -p 5432 -U postgres -d pornily
```

**Password:**
```
ZqZc6NVsp2u5flkNcIHm
```

---

## ⚡ Running Backend and Frontend

### Start Backend (FastAPI)
```bash
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name fastapi
```

### Start Frontend (Vite/React)
```bash
pm2 start npm --name aichat-frontend -- run dev -- --host 0.0.0.0 --port 5173
```

---

## 📤 Uploading Local Files to EC2

```bash
scp -i "D:/Projects/aichat-pronily/backend/aichat-pem.pem" -r "D:/Projects/aichat-pronily/backend/.env" ubuntu@ec2-13-48-108-119.eu-north-1.compute.amazonaws.com:/home/ubuntu/pornily/pronily/backend/.env
```

---

## 📥 Downloading Files from EC2 to Local

```bash
scp -i "D:/Projects/aichat-pronily/backend/aichat-pem.pem" -r ubuntu@ec2-13-48-108-119.eu-north-1.compute.amazonaws.com:/home/ubuntu/pornily/pronily/backend/.env "D:/Projects/aichat-pronily/backend/.env"
```

---

## 🛠 Notes
- Ensure `pm2` is installed on the EC2 instance.
- Make sure your `.pem` file path is correct before running `scp`.
- Keep database credentials safe — avoid committing them to GitHub.
