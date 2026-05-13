import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        backgroundColor: '#F5F5F5'
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 10
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00323C'
    },
    date: {
        fontSize: 10,
        color: '#666'
    },

    // Score Section
    scoreSection: {
        backgroundColor: '#f2825c',
        borderRadius: 8,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        color: 'white',
        marginBottom: 20
    },
    scoreLeft: { flexDirection: 'row', alignItems: 'center' },
    scoreBadgeImage: { width: 50, height: 50, marginRight: 15 },
    scoreTextLarge: { fontSize: 32, fontWeight: 'bold', color: 'white' },
    scoreTitle: { fontSize: 14, color: '#E0E0E0' },
    scoreMetrics: { flexDirection: 'row', gap: 20 },
    scoreMetricItem: { alignItems: 'center' },
    scoreMetricLabel: { fontSize: 10, color: '#A0C0B0' },
    scoreMetricValue: { fontSize: 16, fontWeight: 'bold', color: 'white' },

    // Charts
    chartSection: { marginBottom: 20 },
    chartImage: { width: '100%', height: 200, objectFit: 'contain' },

    // Overview
    overviewRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    overviewCard: {
        flex: 1,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8
    },
    cardTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 5, color: '#00323C' },
    cardText: { fontSize: 10, lineHeight: 1.4, color: '#444' },

    // Questions
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#00323C', marginBottom: 15, marginTop: 10 },
    questionCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 20,
        marginBottom: 15
    },
    questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    qText: { fontSize: 14, fontWeight: 'bold', color: '#333', width: '80%' },
    skillTag: {
        backgroundColor: '#ECFDF5',
        color: '#f2825c',
        fontSize: 8,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4
    },

    answerBlock: { marginBottom: 10 },
    answerLabel: { fontSize: 10, color: '#666', marginBottom: 2, fontWeight: 'bold' },
    answerBox: {
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 4,
        fontSize: 10,
        color: '#333',
        lineHeight: 1.4
    },
    idealAnswerBox: {
        backgroundColor: '#ECFDF5',
        padding: 10,
        borderRadius: 4,
        fontSize: 10,
        color: '#333',
        lineHeight: 1.4
    },

    improvementsSection: { marginTop: 5 },
    improvementItem: { flexDirection: 'row', marginBottom: 3 },
    bullet: { width: 3, height: 3, backgroundColor: '#f2825c', borderRadius: 2, marginRight: 5, marginTop: 4 },
    improvementText: { fontSize: 10, color: '#444' },

    // Behavioral Analysis Styles
    behavioralSection: {
        marginBottom: 20,
        backgroundColor: '#ECFDF5',
        borderRadius: 8,
        padding: 15,
        borderWidth: 1,
        borderColor: '#f2825c',
        borderStyle: 'solid'
    },
    behavioralHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    behavioralIcon: {
        width: 30,
        height: 30,
        backgroundColor: '#f2825c',
        borderRadius: 15,
        marginRight: 10
    },
    behavioralTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#00323C'
    },
    behavioralSummary: {
        fontSize: 10,
        color: '#444',
        lineHeight: 1.5,
        marginBottom: 10
    },
    behavioralMetrics: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10
    },
    behavioralMetricItem: {
        backgroundColor: 'white',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center'
    },
    behavioralMetricLabel: {
        fontSize: 8,
        color: '#666',
        marginRight: 4
    },
    behavioralMetricValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#00323C'
    },
    behavioralScore: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        marginLeft: 'auto'
    },
    behavioralScoreValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f2825c'
    },
    behavioralScoreLabel: {
        fontSize: 8,
        color: '#666',
        textAlign: 'center'
    },
    // Emotion Distribution Styles
    emotionDistributionSection: {
        marginBottom: 15,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 12
    },
    emotionDistributionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#00323C',
        marginBottom: 8
    },
    emotionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6
    },
    emotionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0'
    },
    emotionLabel: {
        fontSize: 8,
        color: '#666',
        marginRight: 4
    },
    emotionValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#f2825c'
    },
    dominantEmotionBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f2825c'
    },
    dominantEmotionText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#f2825c'
    }
});

interface FacialAnalysis {
    summary?: string;
    consolidated_score?: number;
    eye_contact_avg?: number;
    confidence_avg?: number;
    dominant_emotion?: string;
    stress_level?: string;
    engagement_level?: string;
    recordings_analyzed?: number;
    emotion_distribution?: {
        calm?: number;
        happy?: number;
        surprised?: number;
        fear?: number;
        sad?: number;
        angry?: number;
        confused?: number;
        disgusted?: number;
    };
}

interface Question {
    question: string;
    skills?: string[];
    userAnswer?: string;
    idealAnswer?: string;
    feedback?: string;
    improvements?: string[];
    phase?: string; // intro | main | outro
}

interface InterviewResults {
    questions_breakdown?: Question[];
    scores?: {
        behavioral_competency?: number | string;
        speech_quality?: number | string;
        response_quality?: number | string;
    };
    recruitersView?: string;
    improvementAreas?: string;
    facialAnalysis?: FacialAnalysis;
}

interface InterviewReportPDFProps {
    results: InterviewResults;
    score: number;
    title: string;
    badgeImg?: string | null;
    chartImage?: string | null;
}

export const InterviewReportPDF = ({ results, score, title, chartImage }: InterviewReportPDFProps) => {
    const questions = results?.questions_breakdown || [];
    const facialAnalysis = results?.facialAnalysis;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Interview Performance Report</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.date}>Generated on</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{new Date().toLocaleDateString()}</Text>
                    </View>
                </View>

                <View style={styles.scoreSection}>
                    <View style={styles.scoreLeft}>
                        <View>
                            <Text style={styles.scoreTextLarge}>{score}/100</Text>
                            <Text style={styles.scoreTitle}>{title}</Text>
                        </View>
                    </View>
                    <View style={styles.scoreMetrics}>
                        <View style={styles.scoreMetricItem}>
                            <Text style={styles.scoreMetricLabel}>Behavioural</Text>
                            <Text style={styles.scoreMetricValue}>{results?.scores?.behavioral_competency || '0/30'}</Text>
                        </View>
                        <View style={styles.scoreMetricItem}>
                            <Text style={styles.scoreMetricLabel}>Speech</Text>
                            <Text style={styles.scoreMetricValue}>{results?.scores?.speech_quality || '0/20'}</Text>
                        </View>
                        <View style={styles.scoreMetricItem}>
                            <Text style={styles.scoreMetricLabel}>Response</Text>
                            <Text style={styles.scoreMetricValue}>{results?.scores?.response_quality || '0/50'}</Text>
                        </View>
                    </View>
                </View>

                {chartImage && (
                    <View style={styles.chartSection} wrap={false}>
                        <Image src={chartImage} style={styles.chartImage} />
                    </View>
                )}

                <View style={styles.overviewRow}>
                    <View style={styles.overviewCard}>
                        <Text style={styles.cardTitle}>Recruiter's Perspective</Text>
                        <Text style={styles.cardText}>{results?.recruitersView}</Text>
                    </View>
                    <View style={styles.overviewCard}>
                        <Text style={styles.cardTitle}>Areas for Improvement</Text>
                        <Text style={styles.cardText}>{results?.improvementAreas}</Text>
                    </View>
                </View>

                {/* Behavioral Analysis Section */}
                {facialAnalysis && facialAnalysis.summary && (
                    <View style={styles.behavioralSection} wrap={false}>
                        <View style={styles.behavioralHeader}>
                            <View style={styles.behavioralIcon} />
                            <Text style={styles.behavioralTitle}>AI-Powered Behavioral Analysis</Text>
                        </View>
                        <Text style={styles.behavioralSummary}>{facialAnalysis.summary}</Text>
                        <View style={styles.behavioralMetrics}>
                            <View style={styles.behavioralMetricItem}>
                                <Text style={styles.behavioralMetricLabel}>Eye Contact:</Text>
                                <Text style={styles.behavioralMetricValue}>{Math.round((facialAnalysis.eye_contact_avg || 0) * 100)}%</Text>
                            </View>
                            <View style={styles.behavioralMetricItem}>
                                <Text style={styles.behavioralMetricLabel}>Emotion:</Text>
                                <Text style={styles.behavioralMetricValue}>{facialAnalysis.dominant_emotion || 'N/A'}</Text>
                            </View>
                            <View style={styles.behavioralMetricItem}>
                                <Text style={styles.behavioralMetricLabel}>Stress:</Text>
                                <Text style={styles.behavioralMetricValue}>{facialAnalysis.stress_level || 'N/A'}</Text>
                            </View>
                            <View style={styles.behavioralMetricItem}>
                                <Text style={styles.behavioralMetricLabel}>Engagement:</Text>
                                <Text style={styles.behavioralMetricValue}>{facialAnalysis.engagement_level || 'N/A'}</Text>
                            </View>
                        </View>
                        {/* Emotion Distribution */}
                        {facialAnalysis.emotion_distribution && (
                            <View style={styles.emotionDistributionSection}>
                                <Text style={styles.emotionDistributionTitle}>Emotional Distribution</Text>
                                <View style={styles.emotionGrid}>
                                    {facialAnalysis.emotion_distribution.calm !== undefined && facialAnalysis.emotion_distribution.calm > 0 && (
                                        <View style={styles.emotionItem}>
                                            <Text style={styles.emotionLabel}>Calm:</Text>
                                            <Text style={styles.emotionValue}>{facialAnalysis.emotion_distribution.calm.toFixed(1)}%</Text>
                                        </View>
                                    )}
                                    {facialAnalysis.emotion_distribution.happy !== undefined && facialAnalysis.emotion_distribution.happy > 0 && (
                                        <View style={styles.emotionItem}>
                                            <Text style={styles.emotionLabel}>Happy:</Text>
                                            <Text style={styles.emotionValue}>{facialAnalysis.emotion_distribution.happy.toFixed(1)}%</Text>
                                        </View>
                                    )}
                                    {facialAnalysis.emotion_distribution.surprised !== undefined && facialAnalysis.emotion_distribution.surprised > 0 && (
                                        <View style={styles.emotionItem}>
                                            <Text style={styles.emotionLabel}>Surprised:</Text>
                                            <Text style={styles.emotionValue}>{facialAnalysis.emotion_distribution.surprised.toFixed(1)}%</Text>
                                        </View>
                                    )}
                                    {facialAnalysis.emotion_distribution.fear !== undefined && facialAnalysis.emotion_distribution.fear > 0 && (
                                        <View style={styles.emotionItem}>
                                            <Text style={styles.emotionLabel}>Fear:</Text>
                                            <Text style={styles.emotionValue}>{facialAnalysis.emotion_distribution.fear.toFixed(1)}%</Text>
                                        </View>
                                    )}
                                    {facialAnalysis.emotion_distribution.sad !== undefined && facialAnalysis.emotion_distribution.sad > 0 && (
                                        <View style={styles.emotionItem}>
                                            <Text style={styles.emotionLabel}>Sad:</Text>
                                            <Text style={styles.emotionValue}>{facialAnalysis.emotion_distribution.sad.toFixed(1)}%</Text>
                                        </View>
                                    )}
                                    {facialAnalysis.emotion_distribution.angry !== undefined && facialAnalysis.emotion_distribution.angry > 0 && (
                                        <View style={styles.emotionItem}>
                                            <Text style={styles.emotionLabel}>Angry:</Text>
                                            <Text style={styles.emotionValue}>{facialAnalysis.emotion_distribution.angry.toFixed(1)}%</Text>
                                        </View>
                                    )}
                                    {facialAnalysis.emotion_distribution.confused !== undefined && facialAnalysis.emotion_distribution.confused > 0 && (
                                        <View style={styles.emotionItem}>
                                            <Text style={styles.emotionLabel}>Confused:</Text>
                                            <Text style={styles.emotionValue}>{facialAnalysis.emotion_distribution.confused.toFixed(1)}%</Text>
                                        </View>
                                    )}
                                    {facialAnalysis.emotion_distribution.disgusted !== undefined && facialAnalysis.emotion_distribution.disgusted > 0 && (
                                        <View style={styles.emotionItem}>
                                            <Text style={styles.emotionLabel}>Disgusted:</Text>
                                            <Text style={styles.emotionValue}>{facialAnalysis.emotion_distribution.disgusted.toFixed(1)}%</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                <Text style={styles.sectionTitle}>Detailed Question Analysis</Text>

                {questions.map((q, i) => (
                    <View key={i} style={styles.questionCard} wrap={false}>
                        <View style={styles.questionHeader}>
                            <Text style={styles.qText}>Q{i + 1}: {q.question}</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, width: '20%', justifyContent: 'flex-end' }}>
                                {q.skills?.map((s, idx) => (
                                    <Text key={idx} style={styles.skillTag}>{s}</Text>
                                ))}
                            </View>
                        </View>

                        <View style={styles.answerBlock}>
                            <Text style={styles.answerLabel}>{q.phase === 'outro' ? 'Your Response' : 'Your Answer'}</Text>
                            <View style={styles.answerBox}>
                                <Text>{q.userAnswer}</Text>
                            </View>
                        </View>

                        <View style={styles.answerBlock}>
                            <Text style={styles.answerLabel}>{q.phase === 'outro' ? 'AI Response' : 'Ideal Answer'}</Text>
                            <View style={styles.idealAnswerBox}>
                                <Text>{q.phase === 'outro' ? (q.feedback || q.idealAnswer) : q.idealAnswer}</Text>
                            </View>
                        </View>

                        <View style={styles.improvementsSection}>
                            <Text style={styles.answerLabel}>How to Improve</Text>
                            {q.improvements?.map((imp, idx) => (
                                <View key={idx} style={styles.improvementItem}>
                                    <View style={styles.bullet} />
                                    <Text style={styles.improvementText}>{imp}</Text>
                                </View>
                            ))}
                        </View>

                    </View>
                ))}

            </Page>
        </Document>
    );
};
