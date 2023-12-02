import 'dart:convert';
import '___.dart';

void main(List<String> args) {
  final y = MyEntity.fromJson({
    'name': null,
    'address': null,
    'age': null,
    'pacar': null,
    'salary': null,
    'isNganggur': null,
    'genre': null,
  });
  print(jsonEncode(y));
}
