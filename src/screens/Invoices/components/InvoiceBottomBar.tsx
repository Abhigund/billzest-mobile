import React from "react";
import { Inbox, Receipt } from "lucide-react-native";
import { ThemeTokens } from "../../../theme/tokens";
import FormActionBar from "../../../components/ui/FormActionBar";

interface InvoiceBottomBarProps {
  onDraft: () => void;
  onGenerate: () => void;
  isSubmitting: boolean;
  isEditMode: boolean;
  tokens: ThemeTokens;
}

const InvoiceBottomBar: React.FC<InvoiceBottomBarProps> = ({
  onDraft,
  onGenerate,
  isSubmitting,
  isEditMode,
  tokens,
}) => (
  <FormActionBar
    variant="dual"
    secondaryLabel="Save Draft"
    secondaryIcon={<Inbox size={16} color={tokens.primary} />}
    secondaryVariant="accent"
    onSecondary={onDraft}
    primaryLabel={isSubmitting ? "Saving…" : isEditMode ? "Update Bill" : "Generate Bill"}
    primaryIcon={<Receipt size={16} color={tokens.primaryForeground} />}
    onPrimary={onGenerate}
    loading={isSubmitting}
    disabled={isSubmitting}
  />
);

export default InvoiceBottomBar;
