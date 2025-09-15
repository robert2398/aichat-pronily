pornily :
steps to connect AWS DB using EC2: 
psql -h aichat.c7sw0kqsq1e1.eu-north-1.rds.amazonaws.com -p 5432 -U postgres -d pornily
pass : ZqZc6NVsp2u5flkNcIHm

commands to run backend and frontend:
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name fastapi
pm2 start npm --name aichat-frontend -- run dev -- --host 0.0.0.0 --port 5173

Commands to upload local to ec2 :
scp -i "D:/Projects/aichat-pronily/backend/aichat-pem.pem" -r "D:/Projects/aichat-pronily/backend/.env" ubuntu@ec2-13-48-108-119.eu-north-1.compute.amazonaws.com:/home/ubuntu/pornily/pronily/backend/.env

Commands to download from ec2 to local :
scp -i "D:/Projects/aichat-pronily/backend/aichat-pem.pem" -r ubuntu@ec2-13-48-108-119.eu-north-1.compute.amazonaws.com:/home/ubuntu/pornily/pronily/backend/.env "D:/Projects/aichat-pronily/backend/.env"
