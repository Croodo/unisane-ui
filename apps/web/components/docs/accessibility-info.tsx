"use client";

import type { AccessibilityDef } from "@/lib/docs/types";
import { cn } from "@unisane/ui/lib/utils";

interface AccessibilityInfoProps {
  accessibility: AccessibilityDef;
  className?: string;
}

export function AccessibilityInfo({
  accessibility,
  className,
}: AccessibilityInfoProps) {
  const hasContent =
    accessibility.keyboard?.length ||
    accessibility.screenReader?.length ||
    accessibility.focus?.length ||
    accessibility.aria?.length;

  if (!hasContent) return null;

  // For simple text-based accessibility info (like reference design)
  const isSimpleFormat = !accessibility.keyboard?.length && !accessibility.focus?.length;

  if (isSimpleFormat && accessibility.screenReader?.length) {
    return (
      <div className={cn("space-y-4u", className)}>
        <p className="text-body-large text-on-surface-variant leading-relaxed">
          {accessibility.screenReader[0]}
        </p>
        {accessibility.screenReader.length > 1 && (
          <ul className="list-disc pl-6u space-y-2u">
            {accessibility.screenReader.slice(1).map((item, index) => (
              <li
                key={index}
                className="text-body-medium text-on-surface-variant leading-relaxed"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-8u", className)}>
      {/* Keyboard Navigation */}
      {accessibility.keyboard?.length && (
        <div className="space-y-4u">
          <div className="flex items-center gap-2u">
            <span className="material-symbols-outlined text-[20px]! text-primary">
              keyboard
            </span>
            <h4 className="text-title-small font-semibold text-on-surface">
              Keyboard Navigation
            </h4>
          </div>
          <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
            <table className="w-full text-body-small">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30">
                  <th className="px-6u py-3u text-left text-label-medium font-semibold text-on-surface w-1/3">
                    Key
                  </th>
                  <th className="px-6u py-3u text-left text-label-medium font-semibold text-on-surface">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {accessibility.keyboard.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-outline-variant/15 last:border-none"
                  >
                    <td className="px-6u py-3u">
                      <kbd className="inline-flex items-center gap-1u px-2u py-1u bg-surface-container rounded-sm text-label-medium font-mono font-medium text-on-surface border border-outline-variant/30">
                        {item.key}
                      </kbd>
                    </td>
                    <td className="px-6u py-3u text-on-surface-variant font-medium">
                      {item.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Screen Reader */}
      {accessibility.screenReader?.length && (
        <div className="space-y-4u">
          <div className="flex items-center gap-2u">
            <span className="material-symbols-outlined text-[20px]! text-primary">
              hearing
            </span>
            <h4 className="text-title-small font-semibold text-on-surface">
              Screen Reader Support
            </h4>
          </div>
          <ul className="space-y-2u">
            {accessibility.screenReader.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3u p-3u rounded-md bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[16px]! text-primary shrink-0 mt-0.5">
                  check
                </span>
                <span className="text-body-medium text-on-surface-variant font-medium">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Focus Management */}
      {accessibility.focus?.length && (
        <div className="space-y-4u">
          <div className="flex items-center gap-2u">
            <span className="material-symbols-outlined text-[20px]! text-primary">
              center_focus_strong
            </span>
            <h4 className="text-title-small font-semibold text-on-surface">
              Focus Management
            </h4>
          </div>
          <ul className="space-y-2u">
            {accessibility.focus.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3u p-3u rounded-md bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[16px]! text-primary shrink-0 mt-0.5">
                  check
                </span>
                <span className="text-body-medium text-on-surface-variant font-medium">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
