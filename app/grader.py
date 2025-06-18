import subprocess
from app.models import GradingResult, CodeRunResult
from collections import defaultdict

def run_code(submission_code: str):
    try:
        with open("temp_submission.py", "w") as f:
            f.write(submission_code)
        
        process = subprocess.Popen(["python3", "temp_submission.py"], 
            stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()

        if stderr:
            return CodeRunResult(stdout=stdout.decode(), stderr=stderr.decode(), error="Execution error")
        return CodeRunResult(stdout=stdout.decode(), stderr="", error=None)
    except Exception as e:
        return CodeRunResult(stdout="", stderr="", error=str(e))

def grade_python_submission(submission_code: str, test_groups: list) -> GradingResult:
    passed = True
    output = ""
    results = []

    try:
        # Execute student's code and populate function definitions
        context = {}
        exec(submission_code, context)

        # Loop through each group (1 per function)
        for group in test_groups:
            func_name = group.target_function
            cases = group.test_cases

            if func_name not in context or not callable(context[func_name]):
                passed = False
                for case in cases:
                    results.append({
                        "function": func_name,
                        "input": case.input,
                        "error": f"Function '{func_name}' not found.",
                        "correct": False
                    })
                continue

            func = context[func_name]

            for case in cases:
                try:
                    result = func(*case.input)
                    correct = result == case.expected_output
                    if not correct:
                        passed = False
                    results.append({
                        "function": func_name,
                        "input": case.input,
                        "expected": case.expected_output,
                        "got": result,
                        "correct": correct
                    })
                except Exception as e:
                    passed = False
                    results.append({
                        "function": func_name,
                        "input": case.input,
                        "error": str(e),
                        "correct": False
                    })

    except Exception as e:
        passed = False
        output = str(e)
        results = "Code execution failed"

    return GradingResult(
        passed=passed,
        output=output,
        details=str(results)
    )