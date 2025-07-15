import subprocess
import uuid
import os
from app.models import GradingResult, CodeRunResult
from collections import defaultdict

def run_code(submission_code: str):
    filename = f"temp_{uuid.uuid4().hex}.py"
    try:
        with open(filename, "w") as f:
            f.write(submission_code)

        process = subprocess.Popen(
            ["python3", filename],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()
    finally:
        if os.path.exists(filename):
            os.remove(filename)

    if stderr:
        return CodeRunResult(stdout=stdout.decode(), stderr=stderr.decode(), error="Execution error")
    return CodeRunResult(stdout=stdout.decode(), stderr="", error=None)

def grade_python_submission(submission_code: str, test_groups: list) -> GradingResult:
    # Handle the case where no test cases are provided
    if not test_groups or all(len(group.test_cases) == 0 for group in test_groups):
        # Just try running the code to see if it crashes
        run_result = run_code(submission_code)

        return GradingResult(
            passed=run_result.error is None,
            output=run_result.stdout + ("\n" + run_result.stderr if run_result.stderr else ""),
            details=[]
        )

    passed = True
    output = ""
    results = []

    try:
        context = {}
        exec(submission_code, context)

        class_obj = next((v for v in context.values() if isinstance(v, type)), None)

        for group in test_groups:
            func_name = group.target_function
            cases = group.test_cases
            is_regular_function = func_name in context and callable(context[func_name])

            for case in cases:
                try:
                    if is_regular_function:
                        func = context[func_name]
                        result = func(*case.input)

                    elif class_obj:
                        instance = class_obj(*case.input[:3])
                        if not hasattr(instance, func_name):
                            raise AttributeError(f"Method '{func_name}' not found in class.")
                        method = getattr(instance, func_name)
                        result = method()

                    else:
                        raise NameError(f"Function '{func_name}' not found.")

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
        results = []

    return GradingResult(
        passed=passed,
        output=output,
        details=results
    )