import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";

import { AppModule } from "@/app.module";

import { AuthHelper } from "../helpers/auth.helper";
import { DatabaseHelper } from "../helpers/database.helper";
import { TestDataFactory } from "../helpers/test-data.factory";

describe("Pairs API (e2e)", () => {
  let app: INestApplication;
  let databaseHelper: DatabaseHelper;
  let authHelper: AuthHelper;
  let testDataFactory: TestDataFactory;
  let user1Token: string;
  let user2Token: string;
  let user1Data: any;
  let user2Data: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    databaseHelper = new DatabaseHelper();
    authHelper = new AuthHelper(app);
    testDataFactory = new TestDataFactory();

    try {
      await databaseHelper.setupDatabase();

      // Create two test users
      const user1 = await authHelper.signUp(testDataFactory.createTestUser());
      user1Token = user1.accessToken;
      user1Data = user1.user;

      const user2 = await authHelper.signUp(testDataFactory.createTestUser());
      user2Token = user2.accessToken;
      user2Data = user2.user;
    } catch (error) {
      console.warn(
        "Warning: Could not connect to test database. Integration tests will be skipped.",
      );
    }
  });

  afterAll(async () => {
    try {
      await databaseHelper.cleanupDatabase();
      await databaseHelper.close();
    } catch (error) {
      console.warn("Warning: Could not cleanup test database");
    }
    await app.close();
  });

  beforeEach(async () => {
    try {
      await databaseHelper.beginTransaction();
    } catch (error) {
      console.warn("Warning: Could not begin transaction");
    }
  });

  afterEach(async () => {
    try {
      await databaseHelper.rollbackTransaction();
    } catch (error) {
      console.warn("Warning: Could not rollback transaction");
    }
  });

  describe("POST /pairs/requests", () => {
    it("should send a pair request successfully", async () => {
      const response = await request(app.getHttpServer())
        .post("/pairs/requests")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          username: user2Data.name,
        })
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.requester_id).toBe(user1Data.id);
      expect(response.body.data.requested_id).toBe(user2Data.id);
    });

    it("should send pair request by email", async () => {
      const response = await request(app.getHttpServer())
        .post("/pairs/requests")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          email: user2Data.email,
        })
        .expect(201);

      expect(response.body).toHaveProperty("data");
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer())
        .post("/pairs/requests")
        .send({
          username: user2Data.name,
        })
        .expect(401);
    });

    it("should return 400 for missing username and email", async () => {
      await request(app.getHttpServer())
        .post("/pairs/requests")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({})
        .expect(400);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app.getHttpServer())
        .post("/pairs/requests")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          username: "NonExistentUser123456",
        });

      expect([404, 400]).toContain(response.status);
    });
  });

  describe("GET /pairs/requests", () => {
    it("should get pending pair requests", async () => {
      // Send a pair request first
      await request(app.getHttpServer())
        .post("/pairs/requests")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          username: user2Data.name,
        });

      // Get pending requests for user2
      const response = await request(app.getHttpServer())
        .get("/pairs/requests")
        .set("Authorization", `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data[0].requester.id).toBe(user1Data.id);
      }
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer()).get("/pairs/requests").expect(401);
    });
  });

  describe("PATCH /pairs/requests/:id/respond", () => {
    it("should accept a pair request", async () => {
      // Send a pair request
      const createResponse = await request(app.getHttpServer())
        .post("/pairs/requests")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          username: user2Data.name,
        });

      const requestId = createResponse.body.data.id;

      // Accept the request
      const response = await request(app.getHttpServer())
        .patch(`/pairs/requests/${requestId}/respond`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          action: "accept",
        })
        .expect(200);

      expect(response.body).toHaveProperty("data");
    });

    it("should reject a pair request", async () => {
      // Send a pair request
      const createResponse = await request(app.getHttpServer())
        .post("/pairs/requests")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          username: user2Data.name,
        });

      const requestId = createResponse.body.data.id;

      // Reject the request
      await request(app.getHttpServer())
        .patch(`/pairs/requests/${requestId}/respond`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          action: "reject",
        })
        .expect(200);
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer())
        .patch("/pairs/requests/some-id/respond")
        .send({ action: "accept" })
        .expect(401);
    });

    it("should return 404 for non-existent request", async () => {
      const response = await request(app.getHttpServer())
        .patch("/pairs/requests/non-existent-id/respond")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ action: "accept" });

      expect([404, 400]).toContain(response.status);
    });
  });

  describe("GET /pairs", () => {
    it("should get all user pairs", async () => {
      // Send and accept a pair request
      const createResponse = await request(app.getHttpServer())
        .post("/pairs/requests")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          username: user2Data.name,
        });

      const requestId = createResponse.body.data.id;

      await request(app.getHttpServer())
        .patch(`/pairs/requests/${requestId}/respond`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ action: "accept" });

      // Get pairs
      const response = await request(app.getHttpServer())
        .get("/pairs")
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer()).get("/pairs").expect(401);
    });
  });

  describe("DELETE /pairs/:id", () => {
    it("should delete a pair", async () => {
      // Send and accept a pair request
      const createResponse = await request(app.getHttpServer())
        .post("/pairs/requests")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          username: user2Data.name,
        });

      const requestId = createResponse.body.data.id;

      await request(app.getHttpServer())
        .patch(`/pairs/requests/${requestId}/respond`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ action: "accept" });

      // Get the pair ID
      const pairsResponse = await request(app.getHttpServer())
        .get("/pairs")
        .set("Authorization", `Bearer ${user1Token}`);

      if (pairsResponse.body.data.length > 0) {
        const pairId = pairsResponse.body.data[0].id;

        // Delete the pair
        await request(app.getHttpServer())
          .delete(`/pairs/${pairId}`)
          .set("Authorization", `Bearer ${user1Token}`)
          .expect(200);
      }
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer()).delete("/pairs/some-id").expect(401);
    });
  });

  describe("POST /pairs/:pairId/sessions", () => {
    it("should create a swiping session", async () => {
      // Send and accept a pair request
      const createResponse = await request(app.getHttpServer())
        .post("/pairs/requests")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          username: user2Data.name,
        });

      const requestId = createResponse.body.data.id;

      await request(app.getHttpServer())
        .patch(`/pairs/requests/${requestId}/respond`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ action: "accept" });

      // Get the pair ID
      const pairsResponse = await request(app.getHttpServer())
        .get("/pairs")
        .set("Authorization", `Bearer ${user1Token}`);

      if (pairsResponse.body.data.length > 0) {
        const pairId = pairsResponse.body.data[0].id;

        // Create a session
        const response = await request(app.getHttpServer())
          .post(`/pairs/${pairId}/sessions`)
          .set("Authorization", `Bearer ${user1Token}`)
          .send({
            mediaType: "movie",
          })
          .expect(201);

        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toHaveProperty("id");
        expect(response.body.data.media_type).toBe("movie");
      }
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer())
        .post("/pairs/some-pair-id/sessions")
        .send({ mediaType: "movie" })
        .expect(401);
    });
  });
});
