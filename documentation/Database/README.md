# 📘 Project Technical Documentation

## 🧾 General Information

- **Project Name:**
- **Overview:**  
  Inventory web application that retrieves products from a MySQL database hosted on Amazon RDS using AWS Lambda functions, exposing the endpoints with Amazon Cognito.

- **Main Technologies:**
  - **Frontend:** React, Bootstrap
  - **Backend:** AWS Lambda (Node.js)
  - **Database:** Amazon RDS (MySQL)
  - **Network:** Lambda API Gateway
  - **Other Services:** IAM, CloudWatch and cognito

---

## 📦 Project Structure

### 🛢️ Database (RDS)

- **Engine:** MySQL
- **Schema Example:**

  Database/imageRelationalDiagram
  Database/QueryDatabase

### 🖥️ Frontend

- **Frameworks:**

  - React
  - Bootstrap

- **Main Components:**

  - `getProducts`
  - `addProduct`
  - `editProduct`
  - `deleteProduct`

  - `getClients`
  - `addClient`
  - `editClient`
  - `deleteClient`

### ⚙️ Backend (AWS Lambda)

- **Language:** Node.js
- **Functions:**

  - `getProducts`: Retrieves all products
  - `addProduct`: Adds a new product
  - `editProduct`: Updates an existing product
  - `deleteProduct`: Deletes a product

  - `getClients`: Retrieves all clients
  - `addClient`: Adds a new client
  - `editClient`: Updates an existing client
  - `deleteClient`: Deletes a client

  - `getcategory` : Retrieves all categories
  - `addcategoty` : adds a new category

  - `getsupliers` : Retrieves all supliers
  - `addsuplier` : Adds a new suplier

  - `getsells`: Retrieves all sells

  - `getmovements` : Retrieves all movements

  - `getpurchases` : Retrieves all purchases

## 🔐 Security

- **IAM Role with minimal permissions:**

  - `rds-db:connect`
  - `logs:*` (for debugging with CloudWatch)

- **Network Configuration:**

  - RDS hosted inside a private VPC
  - Lambda has VPC access (if not using RDS Proxy)
  - RDS security group restricted by IP or Lambda ENI

- **Endpoint Protection:**
  - Proper CORS configuration
  - Potential use of API Gateway + Cognito/Auth

---

## ⚙️ Environment

- **AWS Environment:**
  - Region: `eu-west-1`
  - Active Lambda URL:  
    `https://xyz.lambda-url.eu-west-1.on.aws/`

---

## 🚀 Deployment

### Manual

- **Lambda:**

  - Upload `index.js`, `node_modules`, and `package.json` as a `.zip` file

- **Frontend:**
  - Use `Vite` or `React-scripts` and deploy to S3 or another web service

### Automated (Future)

- **CI:** GitHub Actions
- **CD:** AWS CodePipeline or AWS Amplify

---

## 🧪 Testing

- Unit tests: _Pending implementation_
- Manual browser testing
- Load testing with Postman/JMeter (optional)

---

## 📊 Monitoring

- CloudWatch Logs for Lambda functions
- CloudWatch Metrics (errors, execution time, memory usage)
- Alarms via CloudWatch Alarms in case of errors

---

## 📝 To-Do / Future Improvements

- [ ] Implement API Gateway + authentication
- [ ] Create a custom logging system
- [ ] Add automated tests for Lambda functions
- [ ] Set up automated deployment for frontend and backend
