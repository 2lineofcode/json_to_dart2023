class MyEntityGenre {
  num? ko;
  num? rating;

  MyEntityGenre({
    this.ko,
    this.rating,
  });
  MyEntityGenre.fromJson(Map<String, dynamic> json) {
    ko = json['ko']?.toInt() ?? 0;
    rating = json['rating']?.toInt() ?? 0;
  }
  Map<String, dynamic> toJson() {
    final data = <String, dynamic>{};
    data['ko'] = ko;
    data['rating'] = rating;
    return data;
  }
}

class MyEntity {
  String? name;
  String? address;
  num? age;
  String? pacar;
  num? salary;
  bool? isNganggur;
  List<MyEntityGenre?>? genre;

  MyEntity({
    this.name,
    this.address,
    this.age,
    this.pacar,
    this.salary,
    this.isNganggur,
    this.genre,
  });
  MyEntity.fromJson(Map<String, dynamic> json) {
    name = json['name']?.toString() ?? '';
    address = json['address']?.toString() ?? '';
    age = json['age']?.toInt() ?? 0;
    pacar = json['pacar']?.toString() ?? '';
    salary = json['salary']?.toDouble() ?? 0.0;
    isNganggur = json['isNganggur'];
    if (json['genre'] != null) {
      final v = json['genre'];
      final arr0 = <MyEntityGenre>[];
      v.forEach((v) {
        arr0.add(MyEntityGenre.fromJson(v));
      });
      genre = arr0;
    } else {
      genre = [];
    }
  }
  Map<String, dynamic> toJson() {
    final data = <String, dynamic>{};
    data['name'] = name;
    data['address'] = address;
    data['age'] = age;
    data['pacar'] = pacar;
    data['salary'] = salary;
    data['isNganggur'] = isNganggur;
    if (genre != null) {
      final v = genre;
      final arr0 = [];
      v?.forEach((v) {
        arr0.add(v?.toJson());
      });
      data['genre'] = arr0;
    }
    return data;
  }
}
