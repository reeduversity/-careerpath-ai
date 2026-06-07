import { Request, Response, NextFunction } from "express";

export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error internally (but prevent stack traces from leaking to client)
  console.error(`[Global Error Handler] ${req.method} ${req.url}`);
  console.error(err);

  // Return a standardized response per rules
  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
}
