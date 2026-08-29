pipeline {
     agent any 
     environment {
         PROJECT_NAME = "todo-backend" 
         DOCKER_IMAGE = "ritanshbagal/todo-backend" 
         DOCKER_TAG = "${BUILD_NUMBER}" } 
         stages { 

            stage("Checkout"){
                steps{
                    checkout scm
                    echo "checkout successful"
                    echo "Testing from github..."
                }
            }

            stage("Welcome stage") {
                 steps { 
                    echo "Hello pipeline for ${PROJECT_NAME} started..." 
                    echo "Build number is ${BUILD_NUMBER}" 
                } 
            } 
        } 
}