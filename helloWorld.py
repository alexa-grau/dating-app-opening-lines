import sys
import json
import markovify

def getMarkovModel(filename):
    with open(filename) as json_file:
        json_string = json_file.read()
        model_json = json.loads(json_string)
        reconstituted_model = markovify.Text.from_json(model_json)
    json_file.close()
    return reconstituted_model

# print("Inside python file")
model = getMarkovModel("markovModel.json")
# print("Model generated")
newLine = model.make_short_sentence(280)
# print("Returning line")
print(newLine)

sys.stdout.flush()
