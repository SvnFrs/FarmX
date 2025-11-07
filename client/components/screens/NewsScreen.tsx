import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import "../../global.css";
import { SafeAreaView } from "react-native-safe-area-context";
import TablerIconComponent from "@/components/icon";
import { useState } from "react";
import { StatusBar } from "react-native";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { router } from "expo-router";

export function NewsScreen() {
  const [activeTab, setActiveTab] = useState<'news' | 'forum' | 'qa' | 'weather'>('news');

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>FarmX</Text>
          <Text style={styles.headerSubtitle}>Shrimp Health Intelligence</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <TablerIconComponent name="bell" size={24} color="#374151" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'news' && styles.tabActive]}
            onPress={() => setActiveTab('news')}
          >
            <TablerIconComponent name="news" size={20} color={activeTab === 'news' ? '#2563eb' : '#6b7280'} />
            <Text style={[styles.tabText, activeTab === 'news' && styles.tabTextActive]}>News</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'forum' && styles.tabActive]}
            onPress={() => setActiveTab('forum')}
          >
            <TablerIconComponent name="users" size={20} color={activeTab === 'forum' ? '#2563eb' : '#6b7280'} />
            <Text style={[styles.tabText, activeTab === 'forum' && styles.tabTextActive]}>Community</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'qa' && styles.tabActive]}
            onPress={() => setActiveTab('qa')}
          >
            <TablerIconComponent name="message-circle" size={20} color={activeTab === 'qa' ? '#2563eb' : '#6b7280'} />
            <Text style={[styles.tabText, activeTab === 'qa' && styles.tabTextActive]}>Expert Q&A</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'weather' && styles.tabActive]}
            onPress={() => setActiveTab('weather')}
          >
            <TablerIconComponent name="cloud" size={20} color={activeTab === 'weather' ? '#2563eb' : '#6b7280'} />
            <Text style={[styles.tabText, activeTab === 'weather' && styles.tabTextActive]}>Weather</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'news' && <NewsContent />}
        {activeTab === 'forum' && <ForumContent />}
        {activeTab === 'qa' && <QAContent />}
        {activeTab === 'weather' && <WeatherContent />}
      </ScrollView>

      {/* Quick Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(tabs)/camera")}
      >
        <TablerIconComponent name="scan" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// News Content Component
function NewsContent() {
  const newsItems = [
    {
      id: 1,
      category: 'Disease Alert',
      title: 'White Spot Syndrome Detection Increases in Southern Regions',
      excerpt: 'Health authorities report a 15% increase in WSSV cases. Farmers advised to increase monitoring...',
      image: require("../../assets/images/cong-an.jpg"),
      date: '2 hours ago',
      author: 'Dr. Nguyen Tran',
      badge: 'urgent',
    },
    {
      id: 2,
      category: 'Industry News',
      title: 'New AI-Powered Shrimp Grading System Launched',
      excerpt: 'Technology promises 99% accuracy in quality assessment and disease detection...',
      image: require("../../assets/images/food.jpg"),
      date: '5 hours ago',
      author: 'FarmX Research',
      badge: 'innovation',
    },
    {
      id: 3,
      category: 'Market Update',
      title: 'Export Prices Rise 8% This Quarter',
      excerpt: 'Strong international demand drives price increases for premium quality shrimp...',
      date: '1 day ago',
      author: 'Market Analysis',
      badge: 'market',
    },
    {
      id: 4,
      category: 'Best Practices',
      title: 'Optimizing Feed Conversion Ratio in Post-Larvae',
      excerpt: 'New research shows improved FCR through temperature control and feeding schedules...',
      date: '2 days ago',
      author: 'Aquaculture Journal',
      badge: 'education',
    },
  ];

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader
        title="Latest News"
        subtitle="Stay updated with industry insights"
        action={
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        }
      />

      {newsItems.map((item) => (
        <TouchableOpacity key={item.id}>
          <Card>
            <View style={styles.newsItem}>
              {item.image && (
                <Image source={item.image} style={styles.newsImage} />
              )}
              <View style={styles.newsContent}>
                <View style={styles.newsHeader}>
                  <Badge
                    label={item.category}
                    variant={item.badge === 'urgent' ? 'danger' : item.badge === 'innovation' ? 'info' : 'default'}
                  />
                  <Text style={styles.newsDate}>{item.date}</Text>
                </View>
                <Text style={styles.newsTitle}>{item.title}</Text>
                <Text style={styles.newsExcerpt} numberOfLines={2}>{item.excerpt}</Text>
                <View style={styles.newsFooter}>
                  <TablerIconComponent name="user" size={16} color="#6b7280" />
                  <Text style={styles.newsAuthor}>{item.author}</Text>
                </View>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Community Forum Content
function ForumContent() {
  const forumTopics = [
    {
      id: 1,
      title: 'Best practices for PL15-PL20 health monitoring?',
      author: 'Minh Tran',
      replies: 24,
      views: 342,
      lastActivity: '15 min ago',
      category: 'Health Management',
      isHot: true,
    },
    {
      id: 2,
      title: 'Recommended water quality parameters for intensive farming',
      author: 'Hoa Nguyen',
      replies: 18,
      views: 256,
      lastActivity: '1 hour ago',
      category: 'Water Quality',
      isHot: false,
    },
    {
      id: 3,
      title: 'Success story: Increased survival rate to 85% using FarmX',
      author: 'Thanh Le',
      replies: 42,
      views: 589,
      lastActivity: '3 hours ago',
      category: 'Success Stories',
      isHot: true,
    },
    {
      id: 4,
      title: 'Feed conversion optimization techniques',
      author: 'Duc Pham',
      replies: 31,
      views: 412,
      lastActivity: '6 hours ago',
      category: 'Feeding',
      isHot: false,
    },
    {
      id: 5,
      title: 'How to prevent Early Mortality Syndrome (EMS)?',
      author: 'Van Nguyen',
      replies: 56,
      views: 823,
      lastActivity: '8 hours ago',
      category: 'Disease Prevention',
      isHot: true,
    },
  ];

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader
        title="Community Forum"
        subtitle="Connect with fellow farmers"
        action={
          <TouchableOpacity style={styles.newPostButton}>
            <TablerIconComponent name="plus" size={20} color="#2563eb" />
          </TouchableOpacity>
        }
      />

      {forumTopics.map((topic) => (
        <TouchableOpacity key={topic.id}>
          <Card>
            <View style={styles.forumItem}>
              <View style={styles.forumHeader}>
                <Badge label={topic.category} variant="info" />
                {topic.isHot && <Badge label="🔥 Hot" variant="warning" />}
              </View>
              <Text style={styles.forumTitle}>{topic.title}</Text>
              <View style={styles.forumMeta}>
                <View style={styles.forumMetaItem}>
                  <TablerIconComponent name="user" size={16} color="#6b7280" />
                  <Text style={styles.forumMetaText}>{topic.author}</Text>
                </View>
                <View style={styles.forumMetaItem}>
                  <TablerIconComponent name="message" size={16} color="#6b7280" />
                  <Text style={styles.forumMetaText}>{topic.replies} replies</Text>
                </View>
                <View style={styles.forumMetaItem}>
                  <TablerIconComponent name="eye" size={16} color="#6b7280" />
                  <Text style={styles.forumMetaText}>{topic.views}</Text>
                </View>
              </View>
              <Text style={styles.forumLastActivity}>Last activity: {topic.lastActivity}</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Expert Q&A Content
function QAContent() {
  const questions = [
    {
      id: 1,
      question: 'How to identify early signs of WSSV in PL stage?',
      askedBy: 'Farmer123',
      answeredBy: 'Dr. Nguyen Tran',
      answerExcerpt: 'Early detection is critical. Look for these key indicators: lethargy, reddish discoloration of the body, reduced feeding activity, and white spots on the carapace. I recommend daily visual inspection and immediate isolation if symptoms appear.',
      verified: true,
      votes: 45,
      timeAgo: '2 hours ago',
    },
    {
      id: 2,
      question: 'Optimal muscle-to-gut ratio for different growth stages?',
      askedBy: 'AquaFarmer',
      answeredBy: 'Dr. Pham Van Hoa',
      answerExcerpt: 'The ratio varies by stage. For PL15-20, ideal range is 2.5-3.0. For juveniles (PL30-40), aim for 3.0-3.5. Adult shrimp should maintain 3.5-4.0 for optimal health and growth performance.',
      verified: true,
      votes: 38,
      timeAgo: '5 hours ago',
    },
    {
      id: 3,
      question: 'Best frequency for health assessments in intensive farming?',
      askedBy: 'TechFarmer',
      answeredBy: 'Dr. Le Minh',
      answerExcerpt: 'In intensive systems, I recommend daily visual checks and bi-weekly detailed assessments using tools like FarmX. This helps catch issues early and maintain optimal growth conditions.',
      verified: true,
      votes: 52,
      timeAgo: '1 day ago',
    },
    {
      id: 4,
      question: 'How to improve survival rates in post-larvae stage?',
      askedBy: 'NewFarmer2024',
      answeredBy: 'Dr. Tran Thu Ha',
      answerExcerpt: 'Focus on three key areas: water quality maintenance (pH 7.5-8.5, DO >5mg/L), proper nutrition with high-quality feed, and regular health monitoring. Temperature stability is also crucial - maintain 28-30°C.',
      verified: true,
      votes: 67,
      timeAgo: '2 days ago',
    },
  ];

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader
        title="Expert Q&A"
        subtitle="Get answers from professionals"
        action={
          <TouchableOpacity style={styles.askButton}>
            <Text style={styles.askButtonText}>Ask Question</Text>
          </TouchableOpacity>
        }
      />

      {questions.map((item) => (
        <TouchableOpacity key={item.id}>
          <Card>
            <View style={styles.qaItem}>
              <View style={styles.qaHeader}>
                <Text style={styles.qaQuestion}>{item.question}</Text>
                {item.verified && (
                  <View style={styles.verifiedBadge}>
                    <TablerIconComponent name="check" size={16} color="#10b981" />
                  </View>
                )}
              </View>
              <Text style={styles.qaAskedBy}>Asked by {item.askedBy} • {item.timeAgo}</Text>

              <View style={styles.qaAnswer}>
                <View style={styles.qaAnswerHeader}>
                  <TablerIconComponent name="user-check" size={20} color="#2563eb" />
                  <Text style={styles.qaExpert}>{item.answeredBy}</Text>
                  <Badge label="Expert" variant="info" />
                </View>
                <Text style={styles.qaAnswerText} numberOfLines={3}>{item.answerExcerpt}</Text>
                <View style={styles.qaFooter}>
                  <TouchableOpacity style={styles.qaVotes}>
                    <TablerIconComponent name="arrow-up" size={18} color="#6b7280" />
                    <Text style={styles.qaVotesText}>{item.votes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text style={styles.qaReadMore}>Read full answer →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Weather & Alerts Content
function WeatherContent() {
  return (
    <View style={styles.sectionContainer}>
      <SectionHeader
        title="Weather & Alerts"
        subtitle="Current conditions for your region"
      />

      {/* Current Weather */}
      <Card style={styles.weatherCard}>
        <View style={styles.weatherMain}>
          <View>
            <Text style={styles.weatherLocation}>Mekong Delta Region</Text>
            <Text style={styles.weatherTemp}>28°C</Text>
            <Text style={styles.weatherCondition}>Partly Cloudy</Text>
          </View>
          <TablerIconComponent name="cloud-sun" size={80} color="#f59e0b" />
        </View>
        <View style={styles.weatherDetails}>
          <View style={styles.weatherDetail}>
            <TablerIconComponent name="droplet" size={20} color="#3b82f6" />
            <Text style={styles.weatherDetailText}>Humidity: 75%</Text>
          </View>
          <View style={styles.weatherDetail}>
            <TablerIconComponent name="wind" size={20} color="#3b82f6" />
            <Text style={styles.weatherDetailText}>Wind: 12 km/h</Text>
          </View>
          <View style={styles.weatherDetail}>
            <TablerIconComponent name="wave" size={20} color="#3b82f6" />
            <Text style={styles.weatherDetailText}>Tide: High at 3 PM</Text>
          </View>
        </View>
      </Card>

      {/* Weather Alerts */}
      <SectionHeader title="Active Alerts" />

      <Card style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <View style={[styles.alertIcon, { backgroundColor: '#fef3c7' }]}>
            <TablerIconComponent name="alert-triangle" size={24} color="#f59e0b" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Heavy Rain Warning</Text>
            <Text style={styles.alertDescription}>
              Expected rainfall: 50-80mm in next 24 hours. Monitor pond water levels and prepare drainage systems.
            </Text>
            <Text style={styles.alertTime}>Issued 2 hours ago</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <View style={[styles.alertIcon, { backgroundColor: '#dbeafe' }]}>
            <TablerIconComponent name="temperature" size={24} color="#3b82f6" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Temperature Advisory</Text>
            <Text style={styles.alertDescription}>
              Night temperatures may drop to 22°C. Consider aeration adjustments to maintain optimal DO levels.
            </Text>
            <Text style={styles.alertTime}>Issued 5 hours ago</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <View style={[styles.alertIcon, { backgroundColor: '#fee2e2' }]}>
            <TablerIconComponent name="virus" size={24} color="#ef4444" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Disease Alert: WSSV Cases Reported</Text>
            <Text style={styles.alertDescription}>
              White Spot Syndrome detected in neighboring farms. Increase biosecurity measures and health monitoring.
            </Text>
            <Text style={styles.alertTime}>Issued 1 day ago</Text>
          </View>
        </View>
      </Card>

      {/* 7-Day Forecast */}
      <SectionHeader title="7-Day Forecast" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
        {[
          { day: 'Mon', high: 29, low: 23, condition: 'sun' },
          { day: 'Tue', high: 27, low: 22, condition: 'cloud-rain' },
          { day: 'Wed', high: 28, low: 23, condition: 'cloud' },
          { day: 'Thu', high: 30, low: 24, condition: 'sun' },
          { day: 'Fri', high: 28, low: 23, condition: 'cloud-rain' },
          { day: 'Sat', high: 27, low: 22, condition: 'cloud' },
          { day: 'Sun', high: 29, low: 24, condition: 'sun' },
        ].map((forecast, index) => (
          <View key={forecast.day} style={styles.forecastDay}>
            <Text style={styles.forecastDayName}>{forecast.day}</Text>
            <TablerIconComponent
              name={forecast.condition}
              size={32}
              color={forecast.condition === 'sun' ? '#f59e0b' : '#3b82f6'}
            />
            <Text style={styles.forecastTemp}>{forecast.high}°C</Text>
            <Text style={styles.forecastLow}>{forecast.low}°C</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabScroll: {
    paddingHorizontal: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#2563eb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  newsItem: {
    gap: 12,
  },
  newsImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  newsContent: {
    gap: 8,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },
  newsExcerpt: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newsAuthor: {
    fontSize: 12,
    color: '#6b7280',
  },
  forumItem: {
    gap: 10,
  },
  forumHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  forumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },
  forumMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  forumMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  forumMetaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  forumLastActivity: {
    fontSize: 12,
    color: '#9ca3af',
  },
  newPostButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaItem: {
    gap: 12,
  },
  qaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  qaQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaAskedBy: {
    fontSize: 12,
    color: '#6b7280',
  },
  qaAnswer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  qaAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qaExpert: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  qaAnswerText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  qaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qaVotes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qaVotesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  qaReadMore: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  askButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  askButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  weatherCard: {
    marginBottom: 16,
  },
  weatherMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherLocation: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  weatherTemp: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
  },
  weatherCondition: {
    fontSize: 18,
    color: '#6b7280',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  weatherDetail: {
    alignItems: 'center',
    gap: 4,
  },
  weatherDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  alertCard: {
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
    gap: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  alertDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  alertTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  forecastScroll: {
    marginTop: 8,
  },
  forecastDay: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    width: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forecastDayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  forecastLow: {
    fontSize: 14,
    color: '#9ca3af',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
