import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";

export interface GalleryCardProps {
  photos: string[];
  onSelectImage: (photos: string[], index: number) => void;
  title?: string;
}

export default function GalleryCard({
  photos,
  onSelectImage,
  title = "Galería de fotos",
}: GalleryCardProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [contentWidth, setContentWidth] = useState(1);
  const [containerWidth, setContainerWidth] = useState(1);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxScroll = contentSize.width - layoutMeasurement.width;
    if (maxScroll > 0) {
      const progress = Math.min(Math.max(contentOffset.x / maxScroll, 0), 1);
      setScrollProgress(progress);
    }
  };

  const showIndicator = contentWidth > containerWidth + 5;

  if (!photos || photos.length === 0) return null;

  return (
    <View style={styles.galleryCard}>
      <Text style={styles.galleryCardTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onContentSizeChange={(w) => setContentWidth(w)}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        contentContainerStyle={styles.galleryScroll}
      >
        {photos.map((imgUrl, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onSelectImage(photos, i)}
            activeOpacity={0.85}
          >
            <Image source={{ uri: imgUrl }} style={styles.galleryImg} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Línea indicadora del scroll restante */}
      {showIndicator && (
        <View style={styles.scrollTrack}>
          <View
            style={[
              styles.scrollThumb,
              { left: `${scrollProgress * 70}%` },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  galleryCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#ECECF1",
    ...Platform.select({
      web: { boxShadow: "0px 4px 10px rgba(0,0,0,0.06)" } as any,
      default: {
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
      },
    }),
  },
  galleryCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  galleryScroll: {
    gap: 12,
    paddingVertical: 2,
  },
  galleryImg: {
    width: 105,
    height: 105,
    borderRadius: 14,
    backgroundColor: "#EEE",
  },
  scrollTrack: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginTop: 12,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  scrollThumb: {
    height: "100%",
    width: "30%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
    position: "absolute",
  },
});
