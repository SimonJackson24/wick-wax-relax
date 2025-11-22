const { sanitizeInput, handleValidationErrors } = require('../../middleware/validation');
const { validationResult } = require('express-validator');
const express = require('express');
const request = require('supertest');

describe('Validation Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('handleValidationErrors with real validation', () => {
    it('should call next() when no validation errors', async () => {
      let nextCalled = false;
      
      app.post('/test', [
        // No validation rules - should pass
      ], handleValidationErrors, (req, res) => {
        nextCalled = true;
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/test')
        .send({ name: 'test' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(nextCalled).toBe(true);
    });

    it('should return 400 with errors when validation fails', async () => {
      const { body, validationResult } = require('express-validator');
      
      app.post('/test', [
        body('email').isEmail().withMessage('Email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password too short')
      ], handleValidationErrors, (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/test')
        .send({ email: 'invalid-email', password: '123' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
    });
  });

  describe('sanitizeInput with real middleware', () => {
    it('should sanitize script tags from request body', async () => {
      app.post('/test', sanitizeInput, (req, res) => {
        res.json(req.body);
      });

      const response = await request(app)
        .post('/test')
        .send({
          comment: '<script>alert("xss")</script>Hello world',
          nested: {
            content: '<script>evil()</script>Safe content'
          }
        })
        .expect(200);

      expect(response.body.comment).not.toContain('<script>');
      expect(response.body.nested.content).not.toContain('<script>');
    });

    it('should sanitize javascript: URLs', async () => {
      app.post('/test', sanitizeInput, (req, res) => {
        res.json(req.body);
      });

      const response = await request(app)
        .post('/test')
        .send({
          link: 'javascript:alert("xss")'
        })
        .expect(200);

      expect(response.body.link).not.toContain('javascript:');
    });

    it('should sanitize event handlers', async () => {
      app.post('/test', sanitizeInput, (req, res) => {
        res.json(req.body);
      });

      const response = await request(app)
        .post('/test')
        .send({
          input: '<input onclick="evil()" value="test">'
        })
        .expect(200);

      expect(response.body.input).not.toContain('onclick');
    });

    it('should handle query and params sanitization', async () => {
      app.get('/test/:id', sanitizeInput, (req, res) => {
        res.json({
          query: req.query,
          params: req.params
        });
      });

      const response = await request(app)
        .get('/test/<script>evil()</script>123')
        .query({ search: '<script>alert("xss")</script>' })
        .expect(200);

      expect(response.body.query.search).not.toContain('<script>');
      expect(response.body.params.id).not.toContain('<script>');
    });

    it('should handle non-string values gracefully', async () => {
      app.post('/test', sanitizeInput, (req, res) => {
        res.json(req.body);
      });

      const testData = {
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' }
      };

      const response = await request(app)
        .post('/test')
        .send(testData)
        .expect(200);

      expect(response.body.number).toBe(123);
      expect(response.body.boolean).toBe(true);
      expect(response.body.array).toEqual([1, 2, 3]);
    });
  });

  describe('Security Features with real requests', () => {
    it('should prevent XSS in nested objects', async () => {
      app.post('/test', sanitizeInput, (req, res) => {
        res.json(req.body);
      });

      const response = await request(app)
        .post('/test')
        .send({
          user: {
            profile: {
              bio: '<script>alert("xss")</script>Bio content',
              settings: {
                theme: '<img src=x onerror=alert("xss")>dark'
              }
            }
          }
        })
        .expect(200);

      expect(response.body.user.profile.bio).not.toContain('<script>');
      expect(response.body.user.profile.settings.theme).not.toContain('onerror');
    });

    it('should handle empty or null values', async () => {
      app.post('/test', sanitizeInput, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/test')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});