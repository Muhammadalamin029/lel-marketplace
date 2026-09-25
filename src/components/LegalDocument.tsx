import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { legalApi, type LegalSlug } from "@/api";

export interface FallbackSection {
  title: string;
  body: string;
}

/** Strip HTML to readable plain text for native rendering. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(br|p|div|h[1-6]|li|tr)[^>]*>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|ul|ol|tr|table|section|article)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .trim();
}

/**
 * Renders a legal document from GET /public/legal/:slug (same source as web),
 * falling back to bundled static sections when offline or unpublished.
 */
export function LegalDocument({
  slug,
  fallback,
  fallbackLabel,
}: {
  slug: LegalSlug;
  fallback: FallbackSection[];
  fallbackLabel: string;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [effectiveLabel, setEffectiveLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    legalApi
      .get(slug)
      .then((doc) => {
        if (doc.body_html && doc.body_html.trim().length > 0) {
          setHtml(doc.body_html);
          setEffectiveLabel(doc.effective_date_label ?? doc.effective_date);
        } else {
          setUsingFallback(true);
        }
      })
      .catch(() => setUsingFallback(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator color="#ff4b26" />
      </View>
    );
  }

  if (html) {
    const paragraphs = htmlToText(html)
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean);
    return (
      <View className="gap-5">
        {effectiveLabel && (
          <View className="bg-[#fff0e9] border border-[#ffd9c7] rounded-2xl p-4">
            <Text className="text-xs text-[#c23a12] font-grotesk-semibold text-center">
              {effectiveLabel}
            </Text>
          </View>
        )}
        <View className="bg-white rounded-2xl p-5 gap-4">
          {paragraphs.map((p, i) => (
            <Text key={i} className="font-grotesk text-sm text-gray-600 leading-relaxed">
              {p}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  // Static fallback (bundled copy)
  return (
    <View className="gap-5">
      {usingFallback && (
        <View className="bg-[#fff0e9] border border-[#ffd9c7] rounded-2xl p-4">
          <Text className="text-xs text-[#c23a12] font-grotesk-semibold text-center">{fallbackLabel}</Text>
        </View>
      )}
      {fallback.map((s) => (
        <View key={s.title} className="bg-white rounded-2xl p-5">
          <Text className="text-sm font-grotesk-extrabold text-gray-900 mb-2">{s.title}</Text>
          <Text className="font-grotesk text-sm text-gray-600 leading-relaxed">{s.body}</Text>
        </View>
      ))}
    </View>
  );
}
