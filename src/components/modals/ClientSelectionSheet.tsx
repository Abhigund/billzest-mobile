import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import ActionSheet from './ActionSheet';
import SearchBar from '../SearchBar';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { Party } from '../../types/domain';
import { User, UserPlus } from 'lucide-react-native';
import { useParties } from '../../hooks/useParties'; // Replaced useClients
import type { AppNavigationParamList } from '../../navigation/types';

type ClientSelectionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelectClient: (client: Party) => void;
  filterClient?: (client: Party) => boolean;
  creationContext?: 'sale' | 'purchase';
};

const ClientSelectionSheet: React.FC<ClientSelectionSheetProps> = ({
  visible,
  onClose,
  onSelectClient,
  filterClient,
  creationContext,
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: clients = [], isLoading } = useParties();

  const filteredClients = clients
    .filter(c => (filterClient ? filterClient(c) : true))
    .filter(
      c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.mobile && c.mobile.includes(searchTerm)),
    );

  const handleSelect = (client: Party) => {
    onSelectClient(client);
    onClose();
  };

  const WALKIN_CLIENT: Party = {
    id: 'walk-in',
    organization_id: '',
    name: 'Walk-in Customer',
    type: 'customer',
    phone: null,
    mobile: null,
    email: null,
    address: null,
    notes: 'Generic customer',
    party_type: 'customer',
    balance: 0,
  };

  const renderItem = ({ item }: { item: Party }) => (
    <Pressable style={styles.itemRow} onPress={() => handleSelect(item)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMeta}>{item.phone || 'No phone'}</Text>
      </View>
    </Pressable>
  );

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      title="Select Client"
      subtitle="Who is this invoice for?"
      scrollable={false}
    >
      <View style={styles.container}>
        <SearchBar
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search name or phone..."
          autoFocus={visible}
        />

        <Pressable
          style={styles.walkInRow}
          onPress={() => handleSelect(WALKIN_CLIENT)}
        >
          <View style={[styles.avatar, { backgroundColor: tokens.primary }]}>
            <User color={tokens.primaryForeground} size={20} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>Walk-in Customer</Text>
            <Text style={styles.itemMeta}>No details recorded</Text>
          </View>
        </Pressable>
        <View style={styles.divider} />

        {isLoading ? (
          <ActivityIndicator color={tokens.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={filteredClients}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No clients found</Text>
            }
          />
        )}

        <Pressable
          style={styles.addNewButton}
          onPress={() => {
            onClose();
            // Using the common Add Party Modal
            navigation.navigate('AddPartySheet', { intent: creationContext });
          }}
        >
          <UserPlus color={tokens.primary} size={18} />
          <Text style={styles.addNewText}>Add New Client</Text>
        </Pressable>
      </View>
    </ActionSheet>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      height: 500,
    },
    listContent: {
      paddingBottom: 20,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    walkInRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: tokens.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tokens.border,
      marginRight: 12,
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '700',
      color: tokens.primary,
    },
    itemInfo: {
      flex: 1,
    },
    itemName: {
      fontSize: 15,
      fontWeight: '600',
      color: tokens.foreground,
      marginBottom: 2,
    },
    itemMeta: {
      fontSize: 12,
      color: tokens.mutedForeground,
    },
    emptyText: {
      textAlign: 'center',
      color: tokens.mutedForeground,
      marginTop: 20,
    },
    addNewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
    },
    addNewText: {
      marginLeft: 8,
      color: tokens.primary,
      fontWeight: '600',
    },
    divider: {
      height: 1,
      backgroundColor: tokens.border,
      marginVertical: 4,
    },
  });

export default ClientSelectionSheet;
