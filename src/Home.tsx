import { Box } from "@mui/joy";
import PostUIProvider from "./components/postui/PostUIProvider";

export default function App(props: any) {
    return (
        <PostUIProvider>
            <Box>
                Hello World
            </Box>
        </PostUIProvider>
    )
  }