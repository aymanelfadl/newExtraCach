import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";

export const HomeButoon = ({ btnData }) => {
  return (
    <View>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: btnData.backgroundColor }]}>
          {btnData.title}
        </Text>
        <View
          style={[styles.line, { backgroundColor: btnData.backgroundColor }]}
        ></View>
      </View>
      <TouchableOpacity
        style={[
          styles.itemContainer,
          { backgroundColor: btnData.backgroundColor },
        ]}
        onPress={btnData.onPress}
      >
        <View style={styles.iconContainer}>
          <Image source={btnData.icon} style={styles.icon} />
        </View>
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{btnData.description}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    margin: 0,
    position: "relative",
    backgroundColor: "white",
  },
  itemContainer: {
    borderRadius: 40,
    borderColor: "#ccc",
    alignSelf: "center",
    alignItems: "center",
    shadowColor: "gray",
    flexDirection: "row",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
    padding: 15,
    marginVertical: 30,
    width: "80%",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    color: "black",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  line: {
    flex: 1,
    height: 2,
  },
  iconContainer: {
    marginRight: 10,
    borderRadius: 100,
    backgroundColor: "rgb(250 250 250)",
    padding: 10,
  },
  icon: {
    width: 40,
    height: 40,
  },
  descriptionContainer: {
    flex: 1,
    marginLeft: 4,
  },
  description: {
    fontSize: 16,
    color: "white",
  },
});
