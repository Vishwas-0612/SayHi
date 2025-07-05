import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../lib/api.js";

const useAuthUser = () => {
  //tanstack query
  const authUser = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false, // Disable retry on failure
  });

  return { isLoading: authUser.isLoading, authUser: authUser.data?.user };
};

export default useAuthUser;
