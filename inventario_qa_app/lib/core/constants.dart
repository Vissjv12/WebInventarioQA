class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.124.182.225:3000/api',
  );

  static const Duration requestTimeout = Duration(seconds: 20);
}
