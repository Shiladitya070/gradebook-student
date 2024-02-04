import { connectDB } from "@/dbConfig/dbConfig";
import assignment from "@/model/AssignmentSchema";
import submisions from "@/model/SubmissionSchema";

import { HfInference } from "@huggingface/inference";
import { NextResponse } from "next/server";

connectDB()
const hf = new HfInference(process.env.HF_KEY)
console.log(process.env.HF_KEY)
const checkAnswer = async (sampleAnswer, answer, _id) => {

    const marks = await hf.sentenceSimilarity({
        model: 'sentence-transformers/paraphrase-xlm-r-multilingual-v1',
        inputs: {
            source_sentence: sampleAnswer,
            sentences: [
                answer
            ]
        }
    })
    return {
        sampleAnswer,
        answer,
        id: _id,
        marks
    }
}

export async function POST(req) {
    const body = await req.json();
    console.log(body)
    const subm = await submisions.findById(body.id)
    const asg = await assignment.findById(subm.assigmentsId)
    const questionFromSubm = subm.questions
    const questionsArray = asg.questions
    // console.log(subm.assigmentsId)
    // console.log("❤️❤️", questionFromSubm)
    // console.log("🟢🟢", questionsArray)
    try {
        questionFromSubm.forEach(async ({ _id, answer }) => {
            const subAns = answer
            console.log(questionsArray)
            const mainQuestion = questionsArray.find(item => JSON.stringify(item._id) == JSON.stringify(_id))
            // console.log(mainQuestion.answer, subAns)
            const result = await checkAnswer(mainQuestion.answer, subAns, _id)
            const updatedSubmisson = await submisions.findByIdAndUpdate(body.id, { questions: { marks: result.marks * 10, answer: result.answer, _id } })
            console.log(result)
        });
        return NextResponse.json({ message: "success" }, { status: 200 });
    } catch (error) {
        // If an error occurs, respond with an error message
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}