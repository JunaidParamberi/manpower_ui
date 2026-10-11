"use client";

import { useEffect, useRef, useState } from "react";
import { DocumentSheet } from "./document-sheet";
import { DocPageMarker } from "./doc-page-marker";

export const PAGE_H = 1130;
export const PAGE_PADDING_TOP = 56;
export const PAGE_PADDING_BOTTOM = 80;
export const PAGE_MARKER_H = 30;
export const CONTENT_W = 800 - 64 * 2;
export const BASE_CONTENT_H =
  PAGE_H - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM - PAGE_MARKER_H;
// Sub-pixel rounding across fonts/borders/paddings can make the real rendered
// height 1–4 px taller than getBoundingClientRect() reports. Shrinking the
// threshold by this amount triggers the page-count round-up early enough to
// prevent content from being clipped by the overflow-hidden window.
export const CONTENT_H_EPSILON = 4;

type DocumentPageBodyProps = {
  children: React.ReactNode;
  headerSlot?: React.ReactNode;
  startPage?: number;
  totalPages?: number;
  onPageCountChange?: (n: number) => void;
  pageLabel?: (pageNum: number, total: number) => string;
  markerLeft?: string;
  variant?: string;
  accentColor?: string | null;
};

export function calculateDocumentPageCount(
  contentHeight: number,
  headerHeight: number,
  columnizedWidth = 0,
) {
  const availableHeight = Math.max(1, BASE_CONTENT_H - headerHeight - CONTENT_H_EPSILON);
  const naturalPageCount = Math.ceil(contentHeight / availableHeight);
  const columnizedPageCount = Math.ceil(columnizedWidth / CONTENT_W);
  return Math.max(1, naturalPageCount, columnizedPageCount);
}

export function DocumentPageBody({
  children,
  headerSlot,
  startPage = 1,
  totalPages,
  onPageCountChange,
  pageLabel = (pageNum, total) => `Page ${pageNum} of ${total}`,
  markerLeft = "",
  variant,
  accentColor,
}: DocumentPageBodyProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const headerMeasureRef = useRef<HTMLDivElement>(null);
  const columnMeasureRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [headerHeight, setHeaderHeight] = useState(0);
  const pageVariant = variant ? `${variant} sheet--page` : "sheet--page";
  const measureSheetClassName = `sheet ${pageVariant} document-page-measure-sheet`;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const contentEl = measureRef.current;
    if (!contentEl) return;

    const update = () => {
      const nextHeaderHeight =
        headerMeasureRef.current?.getBoundingClientRect().height ?? 0;
      const nextPageCount = calculateDocumentPageCount(
        contentEl.getBoundingClientRect().height,
        nextHeaderHeight,
        columnMeasureRef.current?.scrollWidth ?? 0,
      );

      setHeaderHeight((current) =>
        current === nextHeaderHeight ? current : nextHeaderHeight,
      );
      setPageCount((current) =>
        current === nextPageCount ? current : nextPageCount,
      );
      onPageCountChange?.(nextPageCount);
    };

    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(contentEl);
    if (headerMeasureRef.current) {
      resizeObserver.observe(headerMeasureRef.current);
    }
    if (columnMeasureRef.current) {
      resizeObserver.observe(columnMeasureRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [children, headerSlot, headerHeight, onPageCountChange, pageCount, variant]);

  const contentHeight = Math.max(1, BASE_CONTENT_H - headerHeight);
  const effectiveTotalPages = totalPages ?? startPage + pageCount - 1;

  if (isMobile) {
    return (
      <DocumentSheet variant={pageVariant} accentColor={accentColor}>
        {headerSlot ? (
          <div className="document-page-header">{headerSlot}</div>
        ) : null}
        {children}
        <DocPageMarker
          left={markerLeft}
          right={pageLabel(startPage, effectiveTotalPages)}
        />
      </DocumentSheet>
    );
  }

  const pages = Array.from({ length: pageCount }, (_, i) => i);

  return (
    <>
      <div className="document-page-measure" aria-hidden="true">
        <div className={measureSheetClassName}>
          {headerSlot && (
            <div ref={headerMeasureRef} className="document-page-header">
              {headerSlot}
            </div>
          )}
          <div ref={measureRef}>{children}</div>
        </div>

        <div className={measureSheetClassName}>
          {headerSlot && (
            <div className="document-page-header">{headerSlot}</div>
          )}
          <div
            className="document-page-window"
            style={{ width: CONTENT_W, height: contentHeight }}
          >
            <div
              ref={columnMeasureRef}
              className="document-page-columns"
              style={{
                columnCount: 1,
                height: contentHeight,
                width: CONTENT_W,
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>

      {pages.map((i) => {
        const pageNum = startPage + i;

        return (
          <DocumentSheet key={i} variant={pageVariant} accentColor={accentColor}>
            {headerSlot && (
              <div className="document-page-header">{headerSlot}</div>
            )}

            <div
              className="document-page-window"
              style={{ width: CONTENT_W, height: contentHeight }}
            >
              <div
                className="document-page-columns"
                style={{
                  columnCount: pageCount,
                  height: contentHeight,
                  width: CONTENT_W * pageCount,
                  transform: `translateX(-${i * CONTENT_W}px)`,
                }}
              >
                {children}
              </div>
            </div>

            <DocPageMarker
              left={markerLeft}
              right={pageLabel(pageNum, effectiveTotalPages)}
            />
          </DocumentSheet>
        );
      })}
    </>
  );
}
