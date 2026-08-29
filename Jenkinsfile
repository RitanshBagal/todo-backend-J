pipeline {
     agent any 
     environment {
         PROJECT_NAME = "todo-backend" 
         DOCKER_IMAGE = "ritanshbagal/todo-backend" 
         DOCKER_TAG = "${BUILD_NUMBER}" } 
         stages { 
            stage("Welcome stage") {
                 steps { 
                    echo "Hello pipeline for ${PROJECT_NAME} started..." 
                    echo "Build number is ${BUILD_NUMBER}" 
                } 
            } 
        } 
}