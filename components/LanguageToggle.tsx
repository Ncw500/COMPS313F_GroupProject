import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';
import { Colors } from '@/styles/theme';
import { useTheme } from '@/context/ThemeContext';

interface LanguageToggleProps {
    style?: any;
    showLabel?: boolean;
}

export const LanguageToggle = ({ style, showLabel = false }: LanguageToggleProps) => {
    const { language, toggleLanguage } = useLanguage();
    const { isDark } = useTheme();
    const colors = isDark ? Colors.dark : Colors.light;


    // Get label text for current theme
    const getLanguageLabel = () => {
        switch (language) {
            case 'chinese':
                return '繁體中文';
            case 'english':
                return 'English';
        }
    };

    return (
        <TouchableOpacity
            onPress={toggleLanguage}
            style={[
                styles.container,
                { backgroundColor: isDark ? colors.card : colors.surface },
                style
            ]}
        >
            <Ionicons name="language-outline" size={22} color={colors.primary} />
            {showLabel && (
                <Text style={[styles.label, { color: colors.text }]}>
                    {getLanguageLabel()}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    }
});
