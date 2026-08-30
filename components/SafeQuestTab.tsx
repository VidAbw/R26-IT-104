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
              <Ionicons name="sparkles" size={14} color="#B45309" style={{ marginRight: 5 }} />
              <Text style={styles.heroPillText}>CHILD SAFETY ADVENTURE</Text>
            </View>
            <View style={styles.agePill}>
              <Text style={styles.agePillText}>Ages 6–9</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>SafeQuest</Text>
          <Text style={styles.heroTagline}>
            A friendly, interactive game that teaches your child essential safety skills—like stranger awareness, personal boundaries, and safe choices—through playful story quests.
          </Text>

          {/* Action Buttons */}
          <View style={styles.heroActionRow}>
            <TouchableOpacity style={styles.primaryPlayButton} onPress={handlePlayGame} activeOpacity={0.88}>
              <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryPlayButtonText}>PLAY GAME</Text>
              <Ionicons name="open-outline" size={16} color="#FFFFFF" style={{ marginLeft: 6, opacity: 0.85 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryLinkButton}
              onPress={() => Linking.openURL(SAFETQUEST_URL)}
              activeOpacity={0.8}
            >
              <Ionicons name="globe-outline" size={18} color={ProtectivaTheme.primaryDark} style={{ marginRight: 6 }} />
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
      <View style={styles.bottomLaunchCard}>
        <View style={styles.bottomLaunchContent}>
          <Ionicons name="game-controller" size={32} color="#FFFFFF" style={{ marginBottom: 8 }} />
          <Text style={styles.bottomLaunchTitle}>Ready to Play SafeQuest?</Text>
          <Text style={styles.bottomLaunchSub}>
            Start your family’s child-safety journey now in your web browser.
          </Text>
          <TouchableOpacity style={styles.bottomLaunchBtn} onPress={handlePlayGame} activeOpacity={0.88}>
            <Ionicons name="play-circle" size={22} color="#0F172A" style={{ marginRight: 8 }} />
            <Text style={styles.bottomLaunchBtnText}>LAUNCH SAFETQUEST</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  agePill: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCEADF',
  },
  agePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: ProtectivaTheme.primaryDark,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryPlayButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  secondaryLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCEADF',
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
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  topicPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
  },

  // Bottom Launch
  bottomLaunchCard: {
    backgroundColor: '#0F766E',
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomLaunchContent: {
    alignItems: 'center',
    maxWidth: 480,
  },
  bottomLaunchTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  bottomLaunchSub: {
    fontSize: 13,
    color: '#CCFBF1',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  bottomLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE047',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },
  bottomLaunchBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
});
