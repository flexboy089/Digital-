import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';
import googleRoutes from './googleRoutes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API Routes
  app.use('/api/google', googleRoutes);
  
  // Endpoint to send emails securely
  app.post('/api/send-email', async (req, res) => {
    try {
      const { to, subject, html } = req.body;
      
      const apiKey = process.env.EMAIL_API_KEY;
      if (!apiKey) {
        console.warn('EMAIL_API_KEY is not set. Email blocked.');
        return res.status(500).json({ error: 'Email service not configured' });
      }

      const resend = new Resend(apiKey);
      
      const data = await resend.emails.send({
        from: 'Support <onboarding@resend.dev>', // Resend testing domain
        to,
        subject,
        html
      });

      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Failed to send email:', error);
      res.status(500).json({ error: error.message || 'Failed to send email' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
