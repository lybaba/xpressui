import { Box } from "@mui/joy";
import PostUIProvider from "./components/post-ui/PostUIProvider";

export default function App(props: any) {
    return (
        <PostUIProvider>
            <Box>
                Hello World
            </Box>
        </PostUIProvider>
    )

  }