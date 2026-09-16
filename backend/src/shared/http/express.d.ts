declare global {
  namespace Express {
    interface Request {
      id?: string;
      auth?: { userId: string; email: string; permissions: string[] };
    }
  }
}

export {};
