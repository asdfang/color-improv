#!/bin/bash

echo "========================================="
echo "Testing Color Improv Auth Routes"
echo "========================================="

echo -e "\n1. Health Check"
curl http://localhost:3001/api/health
echo ""

echo -e "\n2. Register New User"
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123"}'
echo ""

echo -e "\n3. Try Registering Same Email (should fail)"
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Another User","password":"different"}'
echo ""

echo -e "\n4. Login"
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
echo ""

echo -e "\n5. Get Current User (authenticated)"
curl -b cookies.txt http://localhost:3001/api/auth/me
echo ""

echo -e "\n6. Get Current User Without Cookie (should fail)"
curl http://localhost:3001/api/auth/me
echo ""

echo -e "\n7. Login with Wrong Password (should fail)"
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'
echo ""

echo -e "\n8. Logout"
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3001/api/auth/logout
echo ""

echo -e "\n9. Verify Logged Out"
curl -b cookies.txt http://localhost:3001/api/auth/me
echo ""

echo -e "\n========================================="
echo "Tests Complete!"
echo "========================================="

# Cleanup
rm -f cookies.txt