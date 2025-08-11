"use client";

import * as Popover from "@radix-ui/react-popover";
import React from "react";

type InlinePopoverProps = {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "bottom";
  maxWidth?: number;
  className?: string;
};

export default function InlinePopover({
  children,
  content,
  side = "top",
  maxWidth = 280,
  className,
}: InlinePopoverProps) {
  return (
    <span className={`inline-popover ${className ?? ""}`}>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button type="button" className="inline-popover__trigger">
            {children}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="inline-popover__content"
            side={side}
            sideOffset={2}
            align="start"
            avoidCollisions
            collisionPadding={8}
            style={{ maxWidth }}
          >
            {content}
            <Popover.Arrow
              className="inline-popover__arrow"
              width={10}
              height={6}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </span>
  );
}
