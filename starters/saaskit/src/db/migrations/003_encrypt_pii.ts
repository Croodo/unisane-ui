/**
 * Migration: 003_encrypt_pii
 *
 * Encrypts existing PII fields (email, phone) in the users collection.
 * This migration:
 * 1. Adds emailEncrypted, emailSearchToken for all users with email
 * 2. Adds phoneEncrypted, phoneSearchToken for all users with phone
 * 3. Keeps plaintext fields for migration safety (will be removed in future migration)
 *
 * PREREQUISITES:
 * - DATA_ENCRYPTION_KEY must be set in environment
 * - Run 001_ensure_indexes first to create searchToken indexes
 */

import type { Migration } from "@unisane/kernel";
import { ObjectId } from "mongodb";

export const migration: Migration = {
  id: "003_encrypt_pii",
  description: "Encrypt PII fields (email, phone) in users collection",
  dependencies: ["001_ensure_indexes"],

  up: async (ctx) => {
    const {
      col,
      COLLECTIONS,
      encryptField,
      createSearchToken,
      parseEncryptionKey,
    } = await import("@unisane/kernel");

    // Verify DATA_ENCRYPTION_KEY is set
    const keyBase64 = process.env.DATA_ENCRYPTION_KEY;
    if (!keyBase64) {
      throw new Error(
        "DATA_ENCRYPTION_KEY environment variable is required for this migration"
      );
    }

    const encryptionKey = parseEncryptionKey(keyBase64);
    ctx.log.info("Encryption key loaded successfully");

    if (ctx.dryRun) {
      ctx.log.info("Would encrypt PII fields in users collection");
      const usersCol = col(COLLECTIONS.USERS);
      const totalUsers = await usersCol.countDocuments({});
      const usersWithEmail = await usersCol.countDocuments({
        email: { $exists: true, $ne: null },
      });
      const usersWithPhone = await usersCol.countDocuments({
        phone: { $exists: true, $ne: null },
      });
      ctx.log.info(
        `Would process ${totalUsers} users (${usersWithEmail} with email, ${usersWithPhone} with phone)`
      );
      return;
    }

    const usersCol = col(COLLECTIONS.USERS);

    // Find all users (even soft-deleted ones - we need to encrypt all PII)
    const users = await usersCol
      .find({
        $or: [
          { emailEncrypted: { $exists: false } },
          { emailSearchToken: { $exists: false } },
        ],
      })
      .toArray();

    ctx.log.info(`Found ${users.length} users to process`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        const updates: Record<string, unknown> = {};

        // Encrypt email if present and not already encrypted
        if (user.email && !user.emailEncrypted) {
          const emailNormalized = user.email.toLowerCase();
          updates.emailEncrypted = encryptField(user.email, encryptionKey);
          updates.emailSearchToken = createSearchToken(
            emailNormalized,
            encryptionKey
          );
        }

        // Encrypt phone if present and not already encrypted
        if (user.phone && !user.phoneEncrypted) {
          updates.phoneEncrypted = encryptField(user.phone, encryptionKey);
          updates.phoneSearchToken = createSearchToken(
            user.phone,
            encryptionKey
          );
        }

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
          await usersCol.updateOne({ _id: user._id }, { $set: updates });
          processed++;

          if (processed % 100 === 0) {
            ctx.log.info(`Processed ${processed}/${users.length} users`);
          }
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        ctx.log.error(
          `Failed to encrypt user ${user._id}: ${(error as Error).message}`
        );
        // Continue processing other users
      }
    }

    ctx.log.info(
      `Migration complete: ${processed} users encrypted, ${skipped} skipped, ${errors} errors`
    );

    if (errors > 0) {
      throw new Error(
        `Migration completed with ${errors} errors. Check logs for details.`
      );
    }
  },

  down: async (ctx) => {
    const { col, COLLECTIONS } = await import("@unisane/kernel");

    if (ctx.dryRun) {
      ctx.log.info(
        "Would remove encrypted PII fields from users collection"
      );
      return;
    }

    ctx.log.warn("Rolling back PII encryption...");

    const usersCol = col(COLLECTIONS.USERS);

    // Remove encrypted fields (plaintext fields remain)
    const result = await usersCol.updateMany(
      {},
      {
        $unset: {
          emailEncrypted: "",
          emailSearchToken: "",
          phoneEncrypted: "",
          phoneSearchToken: "",
        },
      }
    );

    ctx.log.info(
      `Rollback complete: removed encrypted fields from ${result.modifiedCount} users`
    );
  },
};

export default migration;
