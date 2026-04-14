import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button"; // لو منزلتيش الـ button نزليها الأول
import { FileQuestion } from "lucide-react"; // مكتبة الأيقونات اللي بتنزل مع shadcn

const NotFound = () => {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
            <div className="container flex flex-col items-center justify-center gap-6 text-center">
                {/* أيقونة أو صورة تعبيرية */}
                <div className="rounded-full bg-muted p-6">
                    <FileQuestion className="h-20 w-20 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-7xl font-extrabold tracking-tighter sm:text-9xl">
                        404
                    </h1>
                    <h2 className="text-2xl font-semibold sm:text-3xl">
                        not found
                    </h2>
                    <p className="mx-auto max-w-[500px] text-muted-foreground sm:text-lg">
                        the page you are looking for does not exist
                    </p>
                </div>

                <div className="flex flex-col gap-3 min-[400px]:flex-row">
                    <Button asChild size="lg" className="px-8">
                        <Link to="/">
                            back to home
                        </Link>
                    </Button>

                    <Button variant="outline" size="lg" onClick={() => window.history.back()}>
                        back
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;