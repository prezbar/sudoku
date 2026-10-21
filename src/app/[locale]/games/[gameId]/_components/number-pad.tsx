"use client";

import { EraserIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { emptyCellValue, type CellValue } from "@/lib/sudoku/grid";

const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function NumberPad({
  isDisabled,
  onEnterValue,
}: {
  isDisabled: boolean;
  onEnterValue: (value: CellValue) => void;
}) {
  const t = useTranslations("NumberPad");

  return (
    <div role="group" aria-label={t("label")} className="grid w-full grid-cols-5 gap-2">
      {digits.map((digit) => (
        <Button
          key={digit}
          variant="outline"
          disabled={isDisabled}
          aria-label={t("enterDigit", { digit })}
          onClick={() => onEnterValue(digit)}
          className="h-12 text-xl font-medium"
        >
          {digit}
        </Button>
      ))}
      <Button
        variant="secondary"
        disabled={isDisabled}
        aria-label={t("erase")}
        onClick={() => onEnterValue(emptyCellValue)}
        className="h-12"
      >
        <EraserIcon className="size-5" />
      </Button>
    </div>
  );
}
