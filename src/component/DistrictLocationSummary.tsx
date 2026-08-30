// src/component/DistrictLocationSummary.tsx
// Displays a district-level summary of reported incident locations.
// Shows ONLY district name + count. No exact addresses are displayed.

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchDistrictSummary, DistrictSummaryItem } from "../../lib/locationService";
import { ProtectivaTheme } from "../../constants/theme";

// ─── Colour palette for district bars / donut slices ───────────────────────
const DISTRICT_COLORS = [
  "#0F766E", // teal
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ef4444", // red
  "#3b82f6", // blue
  "#ec4899", // pink
  "#06b6d4", // cyan
];

interface DistrictLocationSummaryProps {
  /** Pass an incrementing number to trigger a re-fetch */
  refreshTrigger?: number;
}

export default function DistrictLocationSummary({ refreshTrigger = 0 }: DistrictLocationSummaryProps) {
  const [summary, setSummary] = useState<DistrictSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchDistrictSummary();
    setSummary(data);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  const totalCount = summary.reduce((acc, d) => acc + d.count, 0);
  const topDistrict = summary[0]?.district ?? "—";
  const districtCount = summary.length;

  const formatTime = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();

  // Find info for selected district
  const selectedItem = summary.find((d) => d.district === selectedDistrict);
  const selectedCount = selectedItem ? selectedItem.count : 0;
  const selectedPct = totalCount > 0 ? ((selectedCount / totalCount) * 100).toFixed(1) : "0.0";

  return (
    <View style={styles.card}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <Ionicons name="map" size={20} color={ProtectivaTheme.primaryDark} style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Reported Locations by District</Text>
          <Text style={styles.cardSubtitle}>
            Summary of user-marked incident locations grouped by district. Click elements to interact.
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={ProtectivaTheme.primaryDark} />
          <Text style={styles.loadingText}>Loading district data…</Text>
        </View>
      ) : summary.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="location-outline" size={36} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No locations marked yet</Text>
          <Text style={styles.emptySubtitle}>
            Use the map in Legal Guidance to mark an incident location.
          </Text>
        </View>
      ) : (
        <>
          {/* ── Stats row ──────────────────────────────────── */}
          <View style={styles.statsRow}>
            <StatTile
              icon="location"
              iconColor={ProtectivaTheme.primaryDark}
              bgColor="#E6F4F1"
              label="Total Marked Locations"
              value={String(totalCount)}
              onPress={() => setSelectedDistrict(null)}
            />
            <StatTile
              icon="business"
              iconColor="#0369a1"
              bgColor="#e0f2fe"
              label="Districts Covered"
              value={String(districtCount)}
              onPress={() => setSelectedDistrict(null)}
            />
            <StatTile
              icon="star"
              iconColor="#b45309"
              bgColor="#fef9c3"
              label="Top District"
              value={topDistrict}
              valueSmall={topDistrict.length > 9}
              onPress={() => setSelectedDistrict(summary[0]?.district ?? null)}
            />
            <StatTile
              icon="refresh"
              iconColor="#6d28d9"
              bgColor="#ede9fe"
              label="Last Updated (Click to Sync)"
              value={lastUpdated ? formatTime(lastUpdated) : "—"}
              valueSmall
              onPress={load}
            />
          </View>

          {/* ── Selected district detail area ───────────────── */}
          {selectedDistrict && (
            <View style={styles.detailPanel}>
              <View style={styles.detailLeft}>
                <Ionicons name="information-circle-outline" size={20} color={ProtectivaTheme.primaryDark} />
                <View style={styles.detailTextWrapper}>
                  <Text style={styles.detailLabel}>
                    Selected District: <Text style={styles.detailValue}>{selectedDistrict}</Text>
                  </Text>
                  <Text style={styles.detailSubtext}>
                    Marked Locations: <Text style={styles.detailBold}>{selectedCount}</Text> | Percentage of Total: <Text style={styles.detailBold}>{selectedPct}%</Text>
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => setSelectedDistrict(null)}
                style={styles.resetButton}
              >
                <Text style={styles.resetButtonText}>Show All / Reset</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Bar chart + Donut row ─────────────────────── */}
          <View style={styles.chartSection}>
            {/* Bar list */}
            <View style={styles.barListContainer}>
              <View style={styles.barListHeader}>
                <Text style={styles.barListCol1}>District</Text>
                <Text style={styles.barListCol2}>Number of Marked Locations</Text>
              </View>
              {summary.map((item, idx) => {
                const pct = totalCount > 0 ? item.count / totalCount : 0;
                const color = DISTRICT_COLORS[idx % DISTRICT_COLORS.length];
                const isSelected = selectedDistrict === item.district;
                const isAnySelected = selectedDistrict !== null;
                const opacity = isAnySelected ? (isSelected ? 1 : 0.45) : 1;

                return (
                  <TouchableOpacity
                    key={item.district}
                    activeOpacity={0.7}
                    onPress={() => setSelectedDistrict(isSelected ? null : item.district)}
                    style={[
                      styles.barRow,
                      isSelected && styles.barRowSelected,
                      { opacity }
                    ]}
                  >
                    <Text style={[styles.barDistrictLabel, isSelected && styles.barDistrictLabelSelected]}>
                      {item.district}
                    </Text>
                    <View style={styles.barTrackWrapper}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${Math.max(pct * 100, 2)}%` as any, backgroundColor: color },
                          ]}
                        />
                      </View>
                      <Text style={styles.barCountLabel}>{item.count}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Donut (pure CSS/SVG on web, simple legend circles on native) */}
            <View style={styles.donutContainer}>
              {Platform.OS === "web" ? (
                <DonutWebChart
                  summary={summary}
                  total={totalCount}
                  colors={DISTRICT_COLORS}
                  selectedDistrict={selectedDistrict}
                  onSelectDistrict={setSelectedDistrict}
                />
              ) : (
                <SimpleLegend
                  summary={summary}
                  total={totalCount}
                  colors={DISTRICT_COLORS}
                  selectedDistrict={selectedDistrict}
                  onSelectDistrict={setSelectedDistrict}
                />
              )}
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Stat tile ──────────────────────────────────────────────────────────────
function StatTile({
  icon,
  iconColor,
  bgColor,
  label,
  value,
  valueSmall = false,
  onPress,
}: {
  icon: any;
  iconColor: string;
  bgColor: string;
  label: string;
  value: string;
  valueSmall?: boolean;
  onPress?: () => void;
}) {
  const isClickable = !!onPress;
  const content = (
    <View style={[styles.statTile, isClickable && styles.clickableTile]}>
      <View style={[styles.statIconCircle, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueSmall && styles.statValueSmall]}>{value}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={{ flex: 1, minWidth: 120 }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// ─── Donut chart (web only, SVG) ────────────────────────────────────────────
function DonutWebChart({
  summary,
  total,
  colors,
  selectedDistrict,
  onSelectDistrict,
}: {
  summary: DistrictSummaryItem[];
  total: number;
  colors: string[];
  selectedDistrict: string | null;
  onSelectDistrict: (d: string | null) => void;
}) {
  const SIZE = 140;
  const STROKE = 24;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const CENTER = SIZE / 2;

  let offset = 0;
  const slices = summary.map((item, idx) => {
    const pct = total > 0 ? item.count / total : 0;
    const length = pct * CIRCUMFERENCE;
    const gap = 2; // small gap between slices
    const s = {
      offset,
      length: Math.max(length - gap, 0),
      color: colors[idx % colors.length],
      district: item.district,
      count: item.count,
      pct,
    };
    offset += length;
    return s;
  });

  return (
    <View style={styles.donutWrapper}>
      {/* SVG donut */}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ display: "block" }}
      >
        {/* Background track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={STROKE}
        />
        {slices.map((s, i) => {
          const isSelected = selectedDistrict === s.district;
          const isAnySelected = selectedDistrict !== null;
          const strokeWidth = isSelected ? STROKE + 4 : STROKE;
          const sliceOpacity = isAnySelected ? (isSelected ? 1 : 0.35) : 1;

          return (
            <circle
              key={i}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${s.length} ${CIRCUMFERENCE}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
              onClick={() => onSelectDistrict(isSelected ? null : s.district)}
              style={{
                cursor: "pointer",
                opacity: sliceOpacity,
                transition: "stroke-width 0.2s, opacity 0.2s",
              }}
            />
          );
        })}
        {/* Centre label */}
        <text x={CENTER} y={CENTER - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f172a">
          {total}
        </text>
        <text x={CENTER} y={CENTER + 14} textAnchor="middle" fontSize="11" fill="#64748b">
          Total
        </text>
      </svg>

      {/* Legend */}
      <View style={styles.donutLegend}>
        {summary.map((item, idx) => {
          const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0";
          const isSelected = selectedDistrict === item.district;
          const isAnySelected = selectedDistrict !== null;
          const opacity = isAnySelected ? (isSelected ? 1 : 0.45) : 1;

          return (
            <TouchableOpacity
              key={item.district}
              activeOpacity={0.7}
              onPress={() => onSelectDistrict(isSelected ? null : item.district)}
              style={[
                styles.legendRow,
                isSelected && styles.legendRowSelected,
                { opacity }
              ]}
            >
              <View style={[styles.legendDot, { backgroundColor: colors[idx % colors.length] }]} />
              <Text style={[styles.legendText, isSelected && styles.legendTextSelected]}>
                {item.district} ({pct}%)
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Simple legend for native ────────────────────────────────────────────────
function SimpleLegend({
  summary,
  total,
  colors,
  selectedDistrict,
  onSelectDistrict,
}: {
  summary: DistrictSummaryItem[];
  total: number;
  colors: string[];
  selectedDistrict: string | null;
  onSelectDistrict: (d: string | null) => void;
}) {
  return (
    <View style={styles.donutLegend}>
      <View style={styles.simpleTotalBadge}>
        <Text style={styles.simpleTotalNum}>{total}</Text>
        <Text style={styles.simpleTotalLabel}>Total</Text>
      </View>
      {summary.map((item, idx) => {
        const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0";
        const isSelected = selectedDistrict === item.district;
        const isAnySelected = selectedDistrict !== null;
        const opacity = isAnySelected ? (isSelected ? 1 : 0.45) : 1;

        return (
          <TouchableOpacity
            key={item.district}
            activeOpacity={0.7}
            onPress={() => onSelectDistrict(isSelected ? null : item.district)}
            style={[
              styles.legendRow,
              isSelected && styles.legendRowSelected,
              { opacity }
            ]}
          >
            <View style={[styles.legendDot, { backgroundColor: colors[idx % colors.length] }]} />
            <Text style={[styles.legendText, isSelected && styles.legendTextSelected]}>
              {item.district} ({pct}%)
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    maxWidth: 260,
  },
  // ── Stats ──────────────────────────────────────────────────
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  statTile: {
    flex: 1,
    minWidth: 120,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
  },
  clickableTile: {
    borderColor: "#cbd5e1",
    ...Platform.select({
      web: { cursor: "pointer" as any },
      default: {},
    }),
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
    lineHeight: 15,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 22,
  },
  statValueSmall: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  // ── Detail Panel ───────────────────────────────────────────
  detailPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDF4",
    borderColor: "#CCFBF1",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  detailTextWrapper: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
  },
  detailValue: {
    fontWeight: "700",
    color: "#0F766E",
  },
  detailSubtext: {
    fontSize: 12,
    color: "#64748b",
  },
  detailBold: {
    fontWeight: "700",
    color: "#334155",
  },
  resetButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#0F766E",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...Platform.select({
      web: { cursor: "pointer" as any },
      default: {},
    }),
  },
  resetButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F766E",
  },
  // ── Charts ─────────────────────────────────────────────────
  chartSection: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  barListContainer: {
    flex: 1.4,
    minWidth: 280,
    gap: 2,
  },
  barListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  barListCol1: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  barListCol2: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    ...Platform.select({
      web: { cursor: "pointer" as any },
      default: {},
    }),
  },
  barRowSelected: {
    backgroundColor: "#F0FDF4",
    borderColor: "#CCFBF1",
  },
  barDistrictLabel: {
    width: 90,
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
  },
  barDistrictLabelSelected: {
    fontWeight: "700",
    color: "#0F766E",
  },
  barTrackWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 6,
  },
  barTrackSelected: {
    shadowColor: "#0F766E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  barCountLabel: {
    width: 24,
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "right" as const,
  },
  // ── Donut ──────────────────────────────────────────────────
  donutContainer: {
    flex: 1,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  donutWrapper: {
    alignItems: "center",
    gap: 12,
  },
  donutLegend: {
    gap: 6,
    alignSelf: "flex-start",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
    ...Platform.select({
      web: { cursor: "pointer" as any },
      default: {},
    }),
  },
  legendRowSelected: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#475569",
  },
  legendTextSelected: {
    fontWeight: "700",
    color: "#0f172a",
  },
  simpleTotalBadge: {
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  simpleTotalNum: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  simpleTotalLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },
});
