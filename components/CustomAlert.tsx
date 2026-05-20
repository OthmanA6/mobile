import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: AlertButton[];
  onClose?: () => void;
}

export default function CustomAlert({
  visible,
  title,
  message,
  type = 'info',
  buttons,
  onClose,
}: CustomAlertProps) {
  if (!visible) return null;

  // Determine Icon & Colors based on type
  const getAlertConfigs = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={36} color="#10b981" />,
          colors: ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.03)'],
          border: 'rgba(16, 185, 129, 0.25)',
          glow: 'rgba(16, 185, 129, 0.1)',
        };
      case 'error':
        return {
          icon: <XCircle size={36} color="#ef4444" />,
          colors: ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.03)'],
          border: 'rgba(239, 68, 68, 0.25)',
          glow: 'rgba(239, 68, 68, 0.1)',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={36} color="#f59e0b" />,
          colors: ['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.03)'],
          border: 'rgba(245, 158, 11, 0.25)',
          glow: 'rgba(245, 158, 11, 0.1)',
        };
      case 'info':
      default:
        return {
          icon: <Info size={36} color="#6366f1" />,
          colors: ['rgba(99, 102, 241, 0.15)', 'rgba(99, 102, 241, 0.03)'],
          border: 'rgba(99, 102, 241, 0.25)',
          glow: 'rgba(99, 102, 241, 0.1)',
        };
    }
  };

  const config = getAlertConfigs();

  const renderedButtons = buttons || [
    { text: 'OK', onPress: onClose, style: 'default' },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop glassmorphism blur */}
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        
        {/* Backdrop color overlay */}
        <View style={styles.backdrop} />

        <Animatable.View
          animation="zoomIn"
          duration={300}
          style={[
            styles.alertBox,
            {
              borderColor: config.border,
              shadowColor: config.glow,
            },
          ]}
        >
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
          
          <LinearGradient
            colors={config.colors as any}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Header Icon container */}
            <View style={styles.iconContainer}>
              {config.icon}
            </View>

            {/* Title */}
            <Text style={styles.titleText}>{title}</Text>

            {/* Message Body */}
            <Text style={styles.messageText}>{message}</Text>

            {/* Action Buttons Row */}
            <View
              style={[
                styles.buttonsContainer,
                renderedButtons.length > 2 && styles.buttonsColumn,
              ]}
            >
              {renderedButtons.map((btn, idx) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                
                let btnBackground: readonly [string, string] = ['#6366f1', '#4f46e5'];
                if (isCancel) {
                  btnBackground = ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'];
                } else if (isDestructive) {
                  btnBackground = ['#ef4444', '#dc2626'];
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    style={[
                      styles.button,
                      isCancel && styles.cancelButton,
                      renderedButtons.length > 2 && styles.columnButton,
                    ]}
                    onPress={() => {
                      if (btn.onPress) btn.onPress();
                      if (onClose) onClose();
                    }}
                  >
                    {!isCancel ? (
                      <LinearGradient
                        colors={btnBackground}
                        style={styles.btnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.buttonText}>{btn.text}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.cancelBtnContent}>
                        <Text style={[styles.buttonText, styles.cancelButtonText]}>
                          {btn.text}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </LinearGradient>
        </Animatable.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
  },
  alertBox: {
    width: width * 0.85,
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  gradientContainer: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  messageText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  buttonsColumn: {
    flexDirection: 'column',
    gap: 10,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  columnButton: {
    width: '100%',
    flex: 0,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  btnGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  cancelButtonText: {
    color: '#94a3b8',
  },
});
