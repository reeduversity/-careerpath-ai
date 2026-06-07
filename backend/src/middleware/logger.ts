import { Request, Response, NextFunction } from "express";

export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = performance.now();

  res.on("finish", () => {
    const duration = performance.now() - start;
    console.log(`[${req.method}] ${req.originalUrl || req.url} - ${res.statusCode} - ${duration.toFixed(2)}ms`);
  });

  next();
}
