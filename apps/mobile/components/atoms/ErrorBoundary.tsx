import { reportErrorBoundaryException } from "@/lib/error-reporting";
import { router } from "expo-router";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";

const MAX_RETRIES = 3;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryCount: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportErrorBoundaryException(error, info);
  }

  private handleReset = () => {
    const nextRetry = this.state.retryCount + 1;
    if (nextRetry >= MAX_RETRIES) {
      this.setState({ retryCount: nextRetry });
    } else {
      this.setState({ hasError: false, retryCount: nextRetry });
    }
  };

  private handleGoHome = () => {
    router.replace("/(tabs)");
  };

  render() {
    if (this.state.hasError) {
      const retriesExhausted = this.state.retryCount >= MAX_RETRIES;

      return (
        <View style={styles.container}>
          <AppText variant="h1">Ups!</AppText>
          <AppText variant="body" style={styles.message}>
            {retriesExhausted
              ? "Greška se ponavlja. Vratite se na početni ekran ili pokušajte kasnije."
              : "Došlo je do neočekivane greške. Pokušajte ponovo."}
          </AppText>
          {retriesExhausted ? (
            <AppButton label="Nazad na početak" onPress={this.handleGoHome} />
          ) : (
            <AppButton label="Pokušaj ponovo" onPress={this.handleReset} />
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  message: {
    textAlign: "center",
    marginBottom: 8,
  },
});
