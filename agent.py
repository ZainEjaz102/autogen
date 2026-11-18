import asyncio
from autogen_agentchat.agents import AssistantAgent 
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_agentchat.ui import Console


model_client = OpenAIChatCompletionClient(
    model="openai/gpt-oss-120b",
    api_key="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",
    base_url="https://api.groq.com/openai/v1",
    model_info={
        "vision": False,
        "function_calling": True,
        "json_output": True,
        "structured_output": False,
        "family": "unknown",
    },
)

def get_weather(city: str) -> str:
    """Get the weather for a given city."""
    return "The weather is 73 degrees and Sunny."


# The system message instructs the agent via natural language.
agent = AssistantAgent(
    name="weather_agent",
    model_client=model_client,
    tools=[get_weather],
    system_message="You are a helpful assistant.",
    reflect_on_tool_use=True,
    model_client_stream=True,  # Enable streaming tokens from the model client.
)


# Run the agent and stream the messages to the console.
async def main() -> None:
    await Console(agent.run_stream(task="What is the weather in Lahore?"))
    # Close the connection to the model client.
    await model_client.close()

if __name__ == "__main__":
    asyncio.run(main())