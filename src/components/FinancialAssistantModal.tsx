import { colors, spacingX, spacingY } from '@/constants/theme';
import * as Icons from "phosphor-react-native";
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { buildFinancialContext, processFinancialQuestionWithOpenAI } from '../../services/financialAssistantService';
import { TransactionType, WalletType } from '../../types';
import { verticalScale } from '../../utils/styling';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface FinancialAssistantModalProps {
  isVisible: boolean;
  onClose: () => void;
  transactions: TransactionType[];
  wallets: WalletType[];
}

const FinancialAssistantModal: React.FC<FinancialAssistantModalProps> = ({
  isVisible,
  onClose,
  transactions,
  wallets,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu asistente financiero Ex-Codox IA. Puedo ayudarte a analizar tus gastos, ingresos, presupuestos y hábitos de consumo. ¿Qué te gustaría saber?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  if (!isVisible) return null;

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const questionText = inputValue;
    setInputValue('');
    setLoading(true);

    try {
      const financialContext = buildFinancialContext(transactions, wallets);
      const response = await processFinancialQuestionWithOpenAI(
        questionText,
        financialContext
      );

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        text: 'Disculpa, hubo un error al procesar tu pregunta. Intenta nuevamente.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderChatBubble = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageBubble,
        item.isUser ? styles.userBubble : styles.botBubble,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          { color: item.isUser ? colors.white : colors.neutral900 },
        ]}
      >
        {item.text}
      </Text>
    </View>
  );

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ex-codox IA</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icons.X color={colors.neutral900} size={verticalScale(24)} weight="bold" />
          </TouchableOpacity>
        </View>

        {/* Chat Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderChatBubble}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={scrollToBottom}
          scrollEnabled
        />

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Analizando tu información financiera...</Text>
          </View>
        )}

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.input}
            placeholder="Pregunta algo sobre tus finanzas..."
            placeholderTextColor={colors.neutral400}
            value={inputValue}
            onChangeText={setInputValue}
            editable={!loading}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (loading || !inputValue.trim()) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={loading || !inputValue.trim()}
          >
            <Icons.PaperPlaneTilt
              color={colors.white}
              size={verticalScale(20)}
              weight="fill"
            />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Pressable>
    </Pressable>
  );
};

export default FinancialAssistantModal;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  container: {
    backgroundColor: colors.neutral900,
    borderTopLeftRadius: verticalScale(20),
    borderTopRightRadius: verticalScale(20),
    height: '90%',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral700,
  },
  headerTitle: {
    fontSize: verticalScale(18),
    fontWeight: '600',
    color: colors.white,
  },
  closeButton: {
    padding: spacingX._10,
  },
  chatContainer: {
    padding: spacingX._15,
    paddingBottom: spacingY._10,
  },
  messageBubble: {
    marginBottom: spacingY._12,
    maxWidth: '85%',
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._10,
    borderRadius: verticalScale(12),
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.neutral300,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: verticalScale(14),
    lineHeight: verticalScale(20),
  },
  loadingContainer: {
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.neutral300,
    fontSize: verticalScale(12),
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral700,
    alignItems: 'flex-end',
    gap: spacingX._10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.neutral700,
    color: colors.white,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    borderRadius: verticalScale(20),
    fontSize: verticalScale(14),
    maxHeight: verticalScale(100),
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    padding: spacingX._12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.green,
    opacity: 0.5,
  },
});
