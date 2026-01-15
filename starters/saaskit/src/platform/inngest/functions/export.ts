import { inngest } from "../client";
import { JobsService } from "@unisane/import-export";
import { getSignedUploadUrl } from "@unisane/kernel";

export const exportCsv = inngest.createFunction(
  { id: "export-csv" },
  { event: "app/export.requested" },
  async ({ event, step }) => {
    const { jobId, tenantId } = event.data;

    const job = await step.run("get-job", async () => {
      return JobsService.getExportById(tenantId, jobId);
    });

    if (!job) return { found: false };

    await step.run("mark-running", async () => {
      await JobsService.markExportRunning(jobId);
    });

    try {
      await step.run("process-upload", async () => {
        const upload = await getSignedUploadUrl(job.key, 300);
        // Simple payload based on format - in real app this would query DB
        let body: string;
        let contentType = "application/json";
        if (job.format === "csv") {
          contentType = "text/csv";
          body = `id,name\n1,Example\n`;
        } else {
          body = JSON.stringify([{ id: 1, name: "Example" }]);
        }

        const res = await fetch(upload.url, {
          method: "PUT",
          headers: { "content-type": contentType },
          body,
        });

        if (!res.ok) throw new Error(`upload failed: ${res.status}`);
      });

      await step.run("mark-done", async () => {
        await JobsService.markExportDone(jobId);
      });

      return { success: true, jobId };
    } catch (e) {
      await step.run("mark-failed", async () => {
        await JobsService.markExportFailed(
          jobId,
          (e as Error)?.message ?? "error"
        );
      });
      throw e;
    }
  }
);
