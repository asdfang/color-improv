#!/bin/bash

# Session 10 Test Script: User Preferences
# Tests the preferences routes with validation

set -e  # Exit on any error

API_URL="http://localhost:3001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Session 10: User Preferences Test ===${NC}\n"

# Cleanup function
cleanup() {
    if [ ! -z "$COOKIE_FILE" ]; then
        rm -f "$COOKIE_FILE"
    fi
}
trap cleanup EXIT

COOKIE_FILE=$(mktemp)

# Generate random email to avoid conflicts
RANDOM_EMAIL="testuser_$(date +%s)@example.com"

echo -e "${YELLOW}Step 1: Register a new user${NC}"
REGISTER_RESPONSE=$(curl -s -c "$COOKIE_FILE" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RANDOM_EMAIL\",\"name\":\"Test User\",\"password\":\"password123\"}")

echo "$REGISTER_RESPONSE" | jq '.'

if echo "$REGISTER_RESPONSE" | jq -e '.user.id' > /dev/null; then
    echo -e "${GREEN}✓ User registered successfully${NC}\n"
else
    echo -e "${RED}✗ Registration failed${NC}"
    exit 1
fi

# Test 1: Get preferences (should return defaults, no DB row yet)
echo -e "${YELLOW}Test 1: GET /api/preferences (first time - should return defaults)${NC}"
PREFS_RESPONSE=$(curl -s -b "$COOKIE_FILE" "$API_URL/preferences")
echo "$PREFS_RESPONSE" | jq '.'

if echo "$PREFS_RESPONSE" | jq -e '.preferences.difficulty == "EASY"' > /dev/null; then
    echo -e "${GREEN}✓ Returns default difficulty${NC}"
else
    echo -e "${RED}✗ Wrong default difficulty${NC}"
    exit 1
fi

if echo "$PREFS_RESPONSE" | jq -e '.preferences.backingTrackVolume == 0.6' > /dev/null; then
    echo -e "${GREEN}✓ Returns default backingTrackVolume${NC}"
else
    echo -e "${RED}✗ Wrong default backingTrackVolume${NC}"
    exit 1
fi

if echo "$PREFS_RESPONSE" | jq -e '.preferences.samplesVolume == 0.8' > /dev/null; then
    echo -e "${GREEN}✓ Returns default samplesVolume${NC}"
else
    echo -e "${RED}✗ Wrong default samplesVolume${NC}"
    exit 1
fi

echo ""

# Test 2: Update preferences (should create DB row)
echo -e "${YELLOW}Test 2: PUT /api/preferences (create with custom values)${NC}"
UPDATE_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X PUT "$API_URL/preferences" \
  -H "Content-Type: application/json" \
  -d '{"difficulty":"HARD","backingTrackVolume":0.3}')
echo "$UPDATE_RESPONSE" | jq '.'

if echo "$UPDATE_RESPONSE" | jq -e '.preferences.difficulty == "HARD"' > /dev/null; then
    echo -e "${GREEN}✓ Updated difficulty${NC}"
else
    echo -e "${RED}✗ Failed to update difficulty${NC}"
    exit 1
fi

if echo "$UPDATE_RESPONSE" | jq -e '.preferences.backingTrackVolume == 0.3' > /dev/null; then
    echo -e "${GREEN}✓ Updated backingTrackVolume${NC}"
else
    echo -e "${RED}✗ Failed to update backingTrackVolume${NC}"
    exit 1
fi

# Verify other fields kept defaults
if echo "$UPDATE_RESPONSE" | jq -e '.preferences.samplesVolume == 0.8' > /dev/null; then
    echo -e "${GREEN}✓ samplesVolume kept default${NC}"
else
    echo -e "${RED}✗ samplesVolume should have kept default${NC}"
    exit 1
fi

echo ""

# Test 3: Get preferences again (should return saved values)
echo -e "${YELLOW}Test 3: GET /api/preferences (should return saved values)${NC}"
SAVED_PREFS=$(curl -s -b "$COOKIE_FILE" "$API_URL/preferences")
echo "$SAVED_PREFS" | jq '.'

if echo "$SAVED_PREFS" | jq -e '.preferences.difficulty == "HARD"' > /dev/null; then
    echo -e "${GREEN}✓ Difficulty persisted${NC}"
else
    echo -e "${RED}✗ Difficulty not persisted${NC}"
    exit 1
fi

echo ""

# Test 4: Partial update (only update one field)
echo -e "${YELLOW}Test 4: PUT /api/preferences (partial update - only samplesVolume)${NC}"
PARTIAL_UPDATE=$(curl -s -b "$COOKIE_FILE" -X PUT "$API_URL/preferences" \
  -H "Content-Type: application/json" \
  -d '{"samplesVolume":0.5}')
echo "$PARTIAL_UPDATE" | jq '.'

if echo "$PARTIAL_UPDATE" | jq -e '.preferences.samplesVolume == 0.5' > /dev/null; then
    echo -e "${GREEN}✓ Updated samplesVolume${NC}"
else
    echo -e "${RED}✗ Failed to update samplesVolume${NC}"
    exit 1
fi

# Verify other fields unchanged
if echo "$PARTIAL_UPDATE" | jq -e '.preferences.difficulty == "HARD"' > /dev/null; then
    echo -e "${GREEN}✓ difficulty unchanged${NC}"
else
    echo -e "${RED}✗ difficulty should be unchanged${NC}"
    exit 1
fi

if echo "$PARTIAL_UPDATE" | jq -e '.preferences.backingTrackVolume == 0.3' > /dev/null; then
    echo -e "${GREEN}✓ backingTrackVolume unchanged${NC}"
else
    echo -e "${RED}✗ backingTrackVolume should be unchanged${NC}"
    exit 1
fi

echo ""

# Test 5: Update boolean fields
echo -e "${YELLOW}Test 5: PUT /api/preferences (update mute toggles)${NC}"
BOOL_UPDATE=$(curl -s -b "$COOKIE_FILE" -X PUT "$API_URL/preferences" \
  -H "Content-Type: application/json" \
  -d '{"backingTrackMuted":true,"samplesMuted":true}')
echo "$BOOL_UPDATE" | jq '.'

if echo "$BOOL_UPDATE" | jq -e '.preferences.backingTrackMuted == true' > /dev/null; then
    echo -e "${GREEN}✓ Updated backingTrackMuted${NC}"
else
    echo -e "${RED}✗ Failed to update backingTrackMuted${NC}"
    exit 1
fi

if echo "$BOOL_UPDATE" | jq -e '.preferences.samplesMuted == true' > /dev/null; then
    echo -e "${GREEN}✓ Updated samplesMuted${NC}"
else
    echo -e "${RED}✗ Failed to update samplesMuted${NC}"
    exit 1
fi

echo ""

# Test 6: Empty update (should be no-op for existing record)
echo -e "${YELLOW}Test 6: PUT /api/preferences (empty body - should be no-op)${NC}"
EMPTY_UPDATE=$(curl -s -b "$COOKIE_FILE" -X PUT "$API_URL/preferences" \
  -H "Content-Type: application/json" \
  -d '{}')
echo "$EMPTY_UPDATE" | jq '.'

# Verify nothing changed
if echo "$EMPTY_UPDATE" | jq -e '.preferences.difficulty == "HARD"' > /dev/null; then
    echo -e "${GREEN}✓ Empty update didn't change difficulty${NC}"
else
    echo -e "${RED}✗ Empty update changed values${NC}"
    exit 1
fi

echo ""

# Test 7: Invalid difficulty (should reject lowercase and invalid values)
echo -e "${YELLOW}Test 7a: PUT /api/preferences (lowercase difficulty - should reject)${NC}"
LOWERCASE_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X PUT "$API_URL/preferences" \
  -H "Content-Type: application/json" \
  -d '{"difficulty":"easy"}')
echo "$LOWERCASE_RESPONSE" | jq '.'

if echo "$LOWERCASE_RESPONSE" | jq -e '.error' > /dev/null; then
    echo -e "${GREEN}✓ Rejected lowercase difficulty${NC}"
else
    echo -e "${RED}✗ Should have rejected lowercase difficulty${NC}"
    exit 1
fi

echo ""

echo -e "${YELLOW}Test 7b: PUT /api/preferences (invalid difficulty - should reject)${NC}"
INVALID_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X PUT "$API_URL/preferences" \
  -H "Content-Type: application/json" \
  -d '{"difficulty":"IMPOSSIBLE"}')
echo "$INVALID_RESPONSE" | jq '.'

if echo "$INVALID_RESPONSE" | jq -e '.error' > /dev/null; then
    echo -e "${GREEN}✓ Rejected invalid difficulty${NC}"
else
    echo -e "${RED}✗ Should have rejected invalid difficulty${NC}"
    exit 1
fi

echo ""

# Test 8: Unauthenticated request (should fail)
echo -e "${YELLOW}Test 8: GET /api/preferences (no auth - should fail)${NC}"
UNAUTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/preferences")
HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}✓ Rejected unauthenticated request${NC}"
else
    echo -e "${RED}✗ Should have returned 401${NC}"
    exit 1
fi

echo ""

echo -e "${GREEN}=== All Session 10 Tests Passed! ===${NC}"
echo ""
echo "Summary:"
echo "  ✓ GET preferences returns defaults when no DB row exists"
echo "  ✓ PUT preferences creates DB row with upsert"
echo "  ✓ Partial updates only change specified fields"
echo "  ✓ Boolean fields update correctly"
echo "  ✓ Empty updates are no-ops"
echo "  ✓ Invalid data is rejected (lowercase and invalid enum values)"
echo "  ✓ Unauthenticated requests are blocked"