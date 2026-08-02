import { useAuth } from '@/contexts/authContext';
import Typo from '@/shared/components/Typo';
import { colors, radius, spacingX, spacingY } from '@/shared/constants/theme';
import * as Icons from 'phosphor-react-native';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { verticalScale } from '../../../../shared/utils/styling';
import { processFinancialQuestion } from '../../application/services/financialAssistantService';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface FinancialAssistantModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const suggestions = [
  '¿En qué gasto más?',
  '¿Cómo puedo ahorrar?',
  'Resume mi situación financiera',
];

const FinancialAssistantModal: React.FC<FinancialAssistantModalProps> = ({ isVisible, onClose }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: 'Hola. Puedo ayudarte a entender tus gastos, ahorro y presupuesto usando únicamente los datos de tu cuenta.',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  if (!isVisible) return null;

  const sendQuestion = async (question: string) => {
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion || loading) return;

    const now = Date.now();
    setMessages((current) => [...current, { id: `user-${now}`, text: normalizedQuestion, isUser: true, timestamp: new Date() }]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await processFinancialQuestion(user?.uid ?? '', normalizedQuestion);
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, text: response, isUser: false, timestamp: new Date() }]);
    } catch (error) {
      setMessages((current) => [...current, {
        id: `error-${Date.now()}`,
        text: error instanceof Error ? error.message : 'No pude responder en este momento. Intenta nuevamente.',
        isUser: false,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageRow, item.isUser && styles.messageRowUser]}>
      {!item.isUser ? <View style={styles.botAvatar}><Icons.Sparkle size={14} color={colors.primary} weight="fill" /></View> : null}
      <View style={[styles.bubble, item.isUser ? styles.userBubble : styles.botBubble]}>
        <Typo size={13} color={item.isUser ? colors.neutral900 : colors.textLight} style={styles.messageText}>{item.text}</Typo>
        <Typo size={9} color={item.isUser ? '#5B3A08' : colors.neutral500} style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
        </Typo>
      </View>
    </View>
  );

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacingY._10) }]} onPress={(event) => event.stopPropagation()}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.assistantAvatar}><Icons.Brain size={22} color={colors.primary} weight="duotone" /></View>
          <View style={styles.headerText}><Typo size={16} fontWeight="800">Asistente Codox</Typo><View style={styles.onlineRow}><View style={styles.onlineDot} /><Typo size={10} color={colors.neutral400}>Analiza solo tus finanzas</Typo></View></View>
          <TouchableOpacity accessibilityLabel="Cerrar asistente" onPress={onClose} style={styles.closeButton}><Icons.X size={20} color={colors.neutral300} weight="bold" /></TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={loading ? (
            <View style={styles.typingRow}><View style={styles.botAvatar}><Icons.Sparkle size={14} color={colors.primary} weight="fill" /></View><View style={styles.typingBubble}><View style={styles.typingDot} /><View style={styles.typingDot} /><View style={styles.typingDot} /></View></View>
          ) : null}
        />

        {messages.length === 1 ? (
          <View style={styles.suggestions}>
            <Typo size={10} color={colors.neutral500} fontWeight="700">PRUEBA PREGUNTANDO</Typo>
            <View style={styles.suggestionWrap}>
              {suggestions.map((suggestion) => <TouchableOpacity key={suggestion} style={styles.suggestionChip} onPress={() => sendQuestion(suggestion)}><Typo size={11} color={colors.textLight}>{suggestion}</Typo></TouchableOpacity>)}
            </View>
          </View>
        ) : null}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Pregunta sobre tus finanzas…"
              placeholderTextColor={colors.neutral500}
              value={inputValue}
              onChangeText={setInputValue}
              editable={!loading}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendQuestion(inputValue)}
            />
            <TouchableOpacity
              accessibilityLabel="Enviar pregunta"
              style={[styles.sendButton, (loading || !inputValue.trim()) && styles.sendButtonDisabled]}
              onPress={() => sendQuestion(inputValue)}
              disabled={loading || !inputValue.trim()}
            >
              <Icons.ArrowUp size={19} color={colors.neutral900} weight="bold" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Pressable>
  );
};

export default FinancialAssistantModal;

const styles = StyleSheet.create({
  overlay: { position: 'absolute', inset: 0, backgroundColor: '#000000A8', justifyContent: 'flex-end', zIndex: 1000 },
  container: { backgroundColor: colors.background, borderTopLeftRadius: radius._24, borderTopRightRadius: radius._24, height: '91%', borderWidth: 1, borderColor: colors.border },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: colors.neutral600, alignSelf: 'center', marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacingX._15, paddingVertical: spacingY._12, borderBottomWidth: 1, borderBottomColor: colors.border },
  assistantAvatar: { width: 42, height: 42, borderRadius: radius._15, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}18` },
  headerText: { flex: 1, marginLeft: spacingX._10, gap: 3 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  closeButton: { width: 38, height: 38, borderRadius: radius._12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  chatContainer: { padding: spacingX._15, paddingBottom: spacingY._10 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacingX._7, marginBottom: spacingY._12, maxWidth: '90%' },
  messageRowUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  botAvatar: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}18` },
  bubble: { paddingHorizontal: spacingX._12, paddingVertical: spacingY._10, borderRadius: radius._17 },
  userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 5 },
  botBubble: { backgroundColor: colors.surfaceElevated, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: colors.border },
  messageText: { lineHeight: verticalScale(19) },
  timestamp: { textAlign: 'right', marginTop: 4 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  typingBubble: { flexDirection: 'row', gap: 4, padding: 12, borderRadius: radius._15, backgroundColor: colors.surfaceElevated },
  typingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.neutral400 },
  suggestions: { paddingHorizontal: spacingX._15, paddingBottom: spacingY._10, gap: spacingY._7 },
  suggestionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacingX._7 },
  suggestionChip: { paddingHorizontal: spacingX._10, paddingVertical: spacingY._7, borderRadius: radius._20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacingX._10, marginHorizontal: spacingX._15, padding: spacingX._7, borderRadius: radius._17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, minHeight: verticalScale(42), maxHeight: verticalScale(100), color: colors.text, paddingHorizontal: spacingX._10, paddingVertical: spacingY._10, fontSize: verticalScale(13) },
  sendButton: { width: 42, height: 42, borderRadius: radius._15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  sendButtonDisabled: { opacity: 0.4 },
});
