import { type LayoutChangeEvent, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { type ReactNode, useMemo, useState } from "react";
import Svg, { Path } from "react-native-svg";
import { colors, radius, spacing, typography } from "@/theme";
import { pointsToSvgPath } from "@/utils/operation";
import type { OperationSignature, SignaturePoint } from "@/types";

interface SignatureFieldProps {
  value: OperationSignature | null;
  signerName: string;
  onChange: (value: OperationSignature | null) => void;
  readonly?: boolean;
  footer?: ReactNode;
}

export function SignatureField({
  value,
  signerName,
  onChange,
  readonly = false,
  footer,
}: SignatureFieldProps) {
  const [canvasReady, setCanvasReady] = useState(false);

  const updateSignature = (nextStrokes: NonNullable<OperationSignature["strokes"]>) => {
    onChange({
      signerName,
      signedAt: new Date().toISOString(),
      strokes: nextStrokes,
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !readonly,
        onMoveShouldSetPanResponder: () => !readonly,
        onPanResponderGrant: (event) => {
          const firstPoint: SignaturePoint = {
            x: event.nativeEvent.locationX,
            y: event.nativeEvent.locationY,
          };
          const nextStrokes = [...(value?.strokes ?? []), { id: `stroke-${Date.now()}`, points: [firstPoint] }];
          updateSignature(nextStrokes);
        },
        onPanResponderMove: (event) => {
          const point: SignaturePoint = {
            x: event.nativeEvent.locationX,
            y: event.nativeEvent.locationY,
          };

          const currentStrokes = value?.strokes ?? [];
          if (currentStrokes.length === 0) {
            return;
          }

          const nextStrokes = [...currentStrokes];
          const activeStroke = nextStrokes[nextStrokes.length - 1];
          nextStrokes[nextStrokes.length - 1] = {
            ...activeStroke,
            points: [...activeStroke.points, point],
          };
          updateSignature(nextStrokes);
        },
      }),
    [readonly, value?.strokes]
  );

  const handleLayout = (_event: LayoutChangeEvent) => {
    setCanvasReady(true);
  };

  const clearSignature = () => onChange(null);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>Assinatura digital</Text>
        {!readonly ? (
          <Pressable onPress={clearSignature}>
            <Text style={styles.clearText}>Limpar</Text>
          </Pressable>
        ) : null}
      </View>

      <View
        style={[styles.canvasBox, readonly && styles.canvasReadonly]}
        onLayout={handleLayout}
        {...(!readonly ? panResponder.panHandlers : {})}
      >
        {!value?.strokes.length ? (
          <Text style={styles.placeholder}>Assine aqui</Text>
        ) : null}

        {canvasReady ? (
          <Svg style={StyleSheet.absoluteFill}>
            {(value?.strokes ?? []).map((stroke) => (
              <Path
                key={stroke.id}
                d={pointsToSvgPath(stroke.points)}
                stroke={colors.primaryDark}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
          </Svg>
        ) : null}
      </View>

      {value?.strokes.length ? (
        <Text style={styles.signatureMeta}>Assinado por {signerName}</Text>
      ) : null}

      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
  clearText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  canvasBox: {
    minHeight: 140,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  canvasReadonly: {
    minHeight: 120,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: typography.bodySmall,
  },
  signatureMeta: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
});
