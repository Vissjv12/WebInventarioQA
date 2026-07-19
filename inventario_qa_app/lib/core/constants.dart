class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://192.168.18.8:3000/api',
  );

  static const Duration requestTimeout = Duration(seconds: 20);
}
