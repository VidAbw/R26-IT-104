import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectivaTheme } from '../constants/theme';

const SAFETQUEST_URL = 'https://ashy-beach-065984203.7.azurestaticapps.net/';

export const SafeQuestTab: React.FC = () => {
  const handlePlayGame = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(SAFETQUEST_URL, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(SAFETQUEST_URL).catch((err) => {
        console.error('Failed to open SafeQuest URL', err);
      });
    }
  };

  const benefits = [
    {
      icon: 'game-controller-outline' as const,
      color: '#D97706',
      bgColor: '#FEF3C7',
      title: 'Fun & Engaging Quests',
      description: 'Story-based adventure map with narrated audio in English and Sinhala designed for kids aged 6–9.',
    },
    {
      icon: 'people-outline' as const,
      color: '#0D9488',
      bgColor: '#E6F4F1',
      title: 'Personalized Guardian',
      description: 'Turns your photo into a familiar in-game guide so your child feels safe, supported, and guided.',
    },
    {
      icon: 'star-outline' as const,
      color: '#6366F1',
      bgColor: '#EEF2FF',
      title: 'Star-Based Learning',
      description: 'Children earn stars for safe choices and receive gentle, instant feedback to learn from mistakes.',
    },
    {
      icon: 'shield-checkmark-outline' as const,
      color: '#059669',
      bgColor: '#DCFCE7',
      title: '100% Private & Device-Only',
      description: 'Photos and child data never leave your device. No cloud uploads, no ads, and no tracking.',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Quick 2-Minute Setup',
      desc: 'Set up your child’s character, create a secret family password, and add a guardian photo.',
    },
    {
      number: '2',
      title: 'Play Safety Missions',
      desc: 'Your child navigates fun real-life situations, solves interactive puzzles, and builds safety instincts.',
    },
    {
      number: '3',
      title: 'Parent Insights & Tips',
      desc: 'Review easy progress summaries and get practical conversation starters for home discussions.',
    },
  ];

  const safetyTopics = [
    { icon: 'walk-outline' as const, label: 'Stranger Awareness' },
    { icon: 'shield-outline' as const, label: 'Body Boundaries & Safety' },
    { icon: 'chatbubbles-outline' as const, label: 'Secrets vs. Surprises' },
    { icon: 'navigate-outline' as const, label: 'Public & School Safety' },
    { icon: 'phone-portrait-outline' as const, label: 'Digital & Online Safety' },
  ];

  return (
    <View style={styles.container}>
      {/* Top Banner / Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeaderContent}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroPillBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#0F766E" />
              <Text style={styles.heroPillText}>Child Safety Adventure</Text>
            </View>
            <View style={styles.agePill}>
              <Ionicons name="people-outline" size={13} color="#475569" />
              <Text style={styles.agePillText}>Ages 6–9</Text>
            </View>
            <View style={styles.verifiedPill}>
              <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
              <Text style={styles.verifiedPillText}>Parent Guided</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>SafeQuest</Text>
          <Text style={styles.heroTagline}>
            A friendly, interactive game that teaches your child essential safety skills—like stranger awareness, personal boundaries, and safe choices—through playful story quests.
          </Text>

          {/* Action Buttons */}
          <View style={styles.heroActionRow}>
            <TouchableOpacity style={styles.primaryPlayButton} onPress={handlePlayGame} activeOpacity={0.88}>
              <LinearGradient
                colors={['#0F766E', '#0E7490', '#0284C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.85 }}
                style={styles.playBtnGradient}
              >
                <View style={styles.playIconBadge}>
                  <Ionicons name="play" size={13} color="#FFFFFF" />
                </View>
                <Text style={styles.primaryPlayButtonText}>Play SafeQuest</Text>
                <Ionicons name="open-outline" size={14} color="rgba(255, 255, 255, 0.85)" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryLinkButton}
              onPress={() => Linking.openURL(SAFETQUEST_URL)}
              activeOpacity={0.85}
            >
              <Ionicons name="globe-outline" size={16} color={ProtectivaTheme.primaryDark} />
              <Text style={styles.secondaryLinkButtonText}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Game Image */}
        <View style={styles.showcaseCardWrapper}>
          <View style={styles.previewImageContainer}>
            <Image
              source={require('../assets/images/safequest_preview.png')}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.previewFooterRow}>
            <View style={styles.previewBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#0D9488" style={{ marginRight: 4 }} />
              <Text style={styles.previewBadgeText}>100% Private</Text>
            </View>
            <View style={styles.previewBadge}>
              <Ionicons name="language" size={13} color="#6366F1" style={{ marginRight: 4 }} />
              <Text style={styles.previewBadgeText}>EN & Sinhala</Text>
            </View>
            <View style={styles.previewBadge}>
              <Ionicons name="star" size={13} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={styles.previewBadgeText}>20 Levels</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 4 Simple Feature Highlights */}
      <View style={styles.benefitsGrid}>
        {benefits.map((item, idx) => (
          <View key={idx} style={styles.benefitCard}>
            <View style={[styles.benefitIconCircle, { backgroundColor: item.bgColor }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={styles.benefitTitle}>{item.title}</Text>
            <Text style={styles.benefitDescription}>{item.description}</Text>
          </View>
        ))}
      </View>

      {/* How It Works for Families */}
      <View style={styles.howItWorksCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="compass-outline" size={22} color={ProtectivaTheme.primaryDark} style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>How SafeQuest Works</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Simple, fun, and designed to help parents start healthy safety conversations at home.
        </Text>

        <View style={styles.stepsRow}>
          {steps.map((step, idx) => (
            <View key={idx} style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Safety Skills Covered */}
      <View style={styles.topicsCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="ribbon-outline" size={22} color={ProtectivaTheme.primaryDark} style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Key Safety Skills Covered</Text>
        </View>
        <View style={styles.topicsList}>
          {safetyTopics.map((topic, idx) => (
            <View key={idx} style={styles.topicPill}>
              <Ionicons name={topic.icon} size={18} color="#0D9488" style={{ marginRight: 8 }} />
              <Text style={styles.topicPillText}>{topic.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom Launch Card */}
      <LinearGradient
        colors={['#0F172A', '#0F766E', '#0284C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bottomLaunchCard}
      >
        <View style={styles.bottomLaunchContent}>
          <View style={styles.bottomLaunchIconContainer}>
            <Ionicons name="game-controller" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.bottomLaunchTitle}>Ready to Play SafeQuest?</Text>
          <Text style={styles.bottomLaunchSub}>
            Start your family’s child-safety journey now in your web browser with guided audio quests.
          </Text>
          <TouchableOpacity style={styles.bottomLaunchBtn} onPress={handlePlayGame} activeOpacity={0.88}>
            <Ionicons name="play-circle" size={20} color="#0F766E" style={{ marginRight: 6 }} />
            <Text style={styles.bottomLaunchBtnText}>Launch SafeQuest Web Game</Text>
            <Ionicons name="open-outline" size={15} color="#0F766E" style={{ marginLeft: 6, opacity: 0.8 }} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  heroHeaderContent: {
    flex: 1,
    minWidth: 290,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  heroPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: 6,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  agePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  agePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 5,
  },
  verifiedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: ProtectivaTheme.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroTagline: {
    fontSize: 14,
    color: ProtectivaTheme.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  primaryPlayButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  playBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 10,
  },
  playIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  primaryPlayButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    gap: 6,
  },
  secondaryLinkButtonText: {
    color: ProtectivaTheme.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  showcaseCardWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 260,
    maxWidth: 320,
    flex: 1,
  },
  previewImageContainer: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewFooterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: ProtectivaTheme.textPrimary,
  },

  // Benefits Grid
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  benefitCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  benefitIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ProtectivaTheme.textPrimary,
    marginBottom: 6,
  },
  benefitDescription: {
    fontSize: 13,
    color: ProtectivaTheme.textSecondary,
    lineHeight: 19,
  },

  // How it works
  howItWorksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: ProtectivaTheme.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: ProtectivaTheme.textSecondary,
    marginBottom: 18,
  },
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  stepCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ProtectivaTheme.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ProtectivaTheme.textPrimary,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    color: ProtectivaTheme.textSecondary,
    lineHeight: 18,
  },

  // Topics
  topicsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topicPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Bottom Launch
  bottomLaunchCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  bottomLaunchContent: {
    alignItems: 'center',
    maxWidth: 500,
  },
  bottomLaunchIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  bottomLaunchTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  bottomLaunchSub: {
    fontSize: 13,
    color: '#CCFBF1',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  bottomLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  bottomLaunchBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.2,
  },
});
