import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Smoke test: placeholder screen renders', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          appBar: AppBar(title: const Text('Test')),
          body: const Center(child: Text('Placeholder')),
        ),
      ),
    );
    expect(find.text('Test'), findsOneWidget);
    expect(find.text('Placeholder'), findsOneWidget);
  });
}
