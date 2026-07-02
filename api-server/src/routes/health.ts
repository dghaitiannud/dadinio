import { Router, type IRouter } from "express";
// 🔴 COMMENTÉ : Supprime la dépendance au monorepo
// import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  // 🔴 MODIFIÉ : Renvoie directement un objet simple pour éviter le crash
  // const data = HealthCheckResponse.parse({ status: "ok" });
  res.json({ status: "ok" });
});

export default router;