#!/bin/bash

set -e

API_URL="http://localhost:3001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

TEST_EMAIL="testuser_$(date +%s)_$RANDOM@example.com"
TEST_PASSWORD="password123"
TEST_NAME="Test User"

echo -e "${YELLOW}=== Auth Routes Test ===${NC}\n"
echo "Using test email: $TEST_EMAIL"
echo ""

cleanup() {
  if [ -n "$COOKIE_FILE" ]; then
    rm -f "$COOKIE_FILE"
  fi
}
trap cleanup EXIT

COOKIE_FILE=$(mktemp)

print_pass() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_fail() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

show_json() {
  echo "$1" | jq '.'
}

echo -e "${YELLOW}Step 1: Health check${NC}"
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/health")
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1 | cut -d: -f2)
show_json "$HEALTH_BODY"

if [ "$HEALTH_CODE" = "200" ]; then
  print_pass "Health endpoint responded with 200"
else
  print_fail "Health endpoint should return 200"
fi

echo ""

echo -e "${YELLOW}Step 2: Register a new user${NC}"
REGISTER_RESPONSE=$(curl -s -c "$COOKIE_FILE" -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"name\":\"$TEST_NAME\",\"password\":\"$TEST_PASSWORD\"}")
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')
REGISTER_CODE=$(echo "$REGISTER_RESPONSE" | tail -n 1 | cut -d: -f2)
show_json "$REGISTER_BODY"

if [ "$REGISTER_CODE" = "201" ]; then
  print_pass "Registration returned 201"
else
  print_fail "Registration should return 201"
fi

if echo "$REGISTER_BODY" | jq -e --arg email "$TEST_EMAIL" --arg name "$TEST_NAME" '.user.id and .user.email == $email and .user.name == $name' > /dev/null; then
  print_pass "Registration returned the created user"
else
  print_fail "Registration response is missing expected user data"
fi

echo ""

echo -e "${YELLOW}Test 1: Register same email again (should fail)${NC}"
DUPLICATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"name\":\"Another User\",\"password\":\"different\"}")
DUPLICATE_BODY=$(echo "$DUPLICATE_RESPONSE" | sed '$d')
DUPLICATE_CODE=$(echo "$DUPLICATE_RESPONSE" | tail -n 1 | cut -d: -f2)
show_json "$DUPLICATE_BODY"

if [ "$DUPLICATE_CODE" = "409" ]; then
  print_pass "Duplicate registration returned 409"
else
  print_fail "Duplicate registration should return 409"
fi

if echo "$DUPLICATE_BODY" | jq -e '.error.code == "EMAIL_TAKEN"' > /dev/null; then
  print_pass "Duplicate registration returned EMAIL_TAKEN"
else
  print_fail "Duplicate registration should return EMAIL_TAKEN"
fi

echo ""

echo -e "${YELLOW}Test 2: Login with correct credentials${NC}"
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_FILE" -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')
LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1 | cut -d: -f2)
show_json "$LOGIN_BODY"

if [ "$LOGIN_CODE" = "200" ]; then
  print_pass "Login returned 200"
else
  print_fail "Login should return 200"
fi

if echo "$LOGIN_BODY" | jq -e --arg email "$TEST_EMAIL" '.user.id and .user.email == $email' > /dev/null; then
  print_pass "Login returned the authenticated user"
else
  print_fail "Login response is missing expected user data"
fi

echo ""

echo -e "${YELLOW}Test 3: Get current user with auth cookie${NC}"
ME_RESPONSE=$(curl -s -b "$COOKIE_FILE" -w "\nHTTP_CODE:%{http_code}" "$API_URL/auth/me")
ME_BODY=$(echo "$ME_RESPONSE" | sed '$d')
ME_CODE=$(echo "$ME_RESPONSE" | tail -n 1 | cut -d: -f2)
show_json "$ME_BODY"

if [ "$ME_CODE" = "200" ]; then
  print_pass "Authenticated /me returned 200"
else
  print_fail "Authenticated /me should return 200"
fi

if echo "$ME_BODY" | jq -e --arg email "$TEST_EMAIL" '.user.id and .user.email == $email' > /dev/null; then
  print_pass "Authenticated /me returned the current user"
else
  print_fail "/me response is missing expected user data"
fi

echo ""

echo -e "${YELLOW}Test 4: Get current user without cookie (should fail)${NC}"
UNAUTH_ME_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/auth/me")
UNAUTH_ME_BODY=$(echo "$UNAUTH_ME_RESPONSE" | sed '$d')
UNAUTH_ME_CODE=$(echo "$UNAUTH_ME_RESPONSE" | tail -n 1 | cut -d: -f2)
show_json "$UNAUTH_ME_BODY"

if [ "$UNAUTH_ME_CODE" = "401" ]; then
  print_pass "Unauthenticated /me returned 401"
else
  print_fail "Unauthenticated /me should return 401"
fi

if echo "$UNAUTH_ME_BODY" | jq -e '.error == "Authentication required"' > /dev/null; then
  print_pass "Unauthenticated /me returned the expected error"
else
  print_fail "Unauthenticated /me should return Authentication required"
fi

echo ""

echo -e "${YELLOW}Test 5: Login with wrong password (should fail)${NC}"
WRONG_PASSWORD_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}")
WRONG_PASSWORD_BODY=$(echo "$WRONG_PASSWORD_RESPONSE" | sed '$d')
WRONG_PASSWORD_CODE=$(echo "$WRONG_PASSWORD_RESPONSE" | tail -n 1 | cut -d: -f2)
show_json "$WRONG_PASSWORD_BODY"

if [ "$WRONG_PASSWORD_CODE" = "401" ]; then
  print_pass "Wrong-password login returned 401"
else
  print_fail "Wrong-password login should return 401"
fi

if echo "$WRONG_PASSWORD_BODY" | jq -e '.error.code == "INVALID_CREDENTIALS"' > /dev/null; then
  print_pass "Wrong-password login returned INVALID_CREDENTIALS"
else
  print_fail "Wrong-password login should return INVALID_CREDENTIALS"
fi

echo ""

echo -e "${YELLOW}Test 6: Logout${NC}"
LOGOUT_RESPONSE=$(curl -s -b "$COOKIE_FILE" -c "$COOKIE_FILE" -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/logout")
LOGOUT_BODY=$(echo "$LOGOUT_RESPONSE" | sed '$d')
LOGOUT_CODE=$(echo "$LOGOUT_RESPONSE" | tail -n 1 | cut -d: -f2)
show_json "$LOGOUT_BODY"

if [ "$LOGOUT_CODE" = "200" ]; then
  print_pass "Logout returned 200"
else
  print_fail "Logout should return 200"
fi

if echo "$LOGOUT_BODY" | jq -e '.message == "Logged out successfully"' > /dev/null; then
  print_pass "Logout returned the expected message"
else
  print_fail "Logout should return the expected success message"
fi

echo ""

echo -e "${YELLOW}Test 7: Verify logged out session is rejected${NC}"
POST_LOGOUT_RESPONSE=$(curl -s -b "$COOKIE_FILE" -w "\nHTTP_CODE:%{http_code}" "$API_URL/auth/me")
POST_LOGOUT_BODY=$(echo "$POST_LOGOUT_RESPONSE" | sed '$d')
POST_LOGOUT_CODE=$(echo "$POST_LOGOUT_RESPONSE" | tail -n 1 | cut -d: -f2)
show_json "$POST_LOGOUT_BODY"

if [ "$POST_LOGOUT_CODE" = "401" ]; then
  print_pass "Post-logout /me returned 401"
else
  print_fail "Post-logout /me should return 401"
fi

if echo "$POST_LOGOUT_BODY" | jq -e '.error == "Authentication required"' > /dev/null; then
  print_pass "Post-logout /me returned the expected error"
else
  print_fail "Post-logout /me should return Authentication required"
fi

echo ""

echo -e "${GREEN}=== All Auth Tests Passed! ===${NC}"
echo ""
echo "Summary:"
echo "  ✓ Health endpoint responds successfully"
echo "  ✓ Registration creates a user and returns auth data"
echo "  ✓ Duplicate registration is rejected"
echo "  ✓ Login and authenticated /me succeed"
echo "  ✓ Unauthenticated and invalid login attempts are blocked"
echo "  ✓ Logout clears the session"